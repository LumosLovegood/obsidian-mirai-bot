import { Bot, Message } from 'mirai-js';
import type { TFile } from 'obsidian';
import { getAtomRead } from 'src/scripts/atomRead';
import { getBiliInfo } from 'src/scripts/bilibili';
import { getBookInfo, searchDouban } from 'src/scripts/doubanBook';
import { getNoteFile, uploadImageByPicgo } from 'src/scripts/utils';
import { getWxoa } from 'src/scripts/wxoa';
import { getZhihu } from 'src/scripts/zhihu';
import type MiraiBot from '../main';
import { createNote } from '../scripts/utils';

export const noteService = async (data: any, bot: Bot, plugin: MiraiBot) => {
	const {
		waitFor,
		sender: { id },
	} = data;
	const vault = app.vault;
	await bot.sendMessage({ friend: id, message: new Message().addText('有在认真听~') });
	const message = new Message();
	const nowTitle = '\n- ' + window.moment().format('HH:mm') + ' ✏️随笔: \n\t';

	const file = await getNoteFile(plugin.settings);

	vault.append(file as TFile, nowTitle);
	message.addText('记录完成√\n---------\n');
	let next = await waitFor.messageChain();
	let note = next[1];
	let isFirst = true;
	// eslint-disable-next-line no-loops/no-loops
	while (!['写完了', '记录完毕', '结束'].includes(note.text ?? '')) {
		if (note.type === 'Plain') {
			let plain = note.text ?? '';
			if (!isFirst && plain != '。') plain = '，' + plain;
			else isFirst = false;
			if (plain?.endsWith('。')) {
				plain = plain.replace(/。$/g, '\n');
				isFirst = true;
			}
			vault.append(file as TFile, plain.replace(/\n/gm, '\n\t'));
			message.addText(plain);
		} else if (note.type === 'Image') {
			await picService(data, bot, plugin, false, next);
			message.addImageUrl(note.url ?? '');
			isFirst = true;
		}
		next = await waitFor.messageChain();
		note = next[1];
	}
	await bot.sendMessage({ friend: id, message: message });
};

export const picService = async (data: any, bot: Bot, plugin: MiraiBot, isRercord: boolean, messageChain?: any) => {
	let message;
	let messageId: number;
	if (!messageChain) {
		message = data.messageChain[1];
		messageId = data.messageChain[0].id;
	} else {
		message = messageChain[1];
		messageId = messageChain[0].id;
	}
	const vault = app.vault;
	const file = await getNoteFile(plugin.settings);
	const imageUrl = (await uploadImageByPicgo(message.url)) ?? message.url;
	let record = `\n![${imageUrl}|300](${imageUrl})`;
	if (isRercord) {
		record = `\n- ${window.moment().format('HH:mm')} 🎴记录图片: ` + record;
	}
	vault
		.append(file as TFile, record)
		.then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				quote: messageId,
				message: new Message().addText('图片记录下来了~'),
			});
		})
		.catch(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				quote: messageId,
				message: new Message().addText('图片无法记录'),
			});
		});
	if (isRercord) {
		await ideaService(data, bot, plugin);
	}
};

export const bilibiliService = async (data: any, bot: Bot, plugin: MiraiBot, url: string) => {
	const senderId = data.sender.id;
	const infoData = await getBiliInfo(url);
	const { cover, author } = infoData;
	if (!cover) return;

	const newFile = await createNote(infoData, '📺B站视频', plugin);

	await bot.sendMessage({
		friend: senderId,
		message: new Message().addText(`📺“${author}”的B站视频已记录√`).addImageUrl(cover),
	});
	await ideaService(data, bot, plugin, { newFile: newFile as TFile });
};

export const zhihuService = async (data: any, bot: Bot, plugin: MiraiBot, url: string) => {
	const infoData = await getZhihu(url);
	const { author, cover } = infoData;
	if (!author) return;
	const newFile = await createNote(infoData, '🔎知乎问答', plugin);
	let message = new Message().addText(`“${author}”的知乎回答已记录~`);
	message = cover && cover != '' ? message.addImageUrl(cover) : message;
	await bot.sendMessage({
		friend: data.sender.id,
		message: message,
	});
	await ideaService(data, bot, plugin, { newFile: newFile as TFile });
};

export const wxoaService = async (data: any, bot: Bot, plugin: MiraiBot, url: string) => {
	const infoData = await getWxoa(url);
	const { author, cover } = infoData;
	if (!author) return;
	const newFile = await createNote(infoData, '📄微信文章', plugin);

	await bot.sendMessage({
		friend: data.sender.id,
		message: new Message().addText(`“${author}”的微信文章已记录~`).addImageUrl(cover),
	});
	await ideaService(data, bot, plugin, { newFile: newFile as TFile });
};

export const atomReadService = async (data: any, bot: Bot, plugin: MiraiBot) => {
	const url = data.text.replace(/.*\n(?=http)/g, '');
	const infoData = await getAtomRead(url);
	const { author, cover } = infoData;
	if (!author) return;
	const newFile = await createNote(infoData, '📄原子阅读', plugin);

	await bot.sendMessage({
		friend: data.sender.id,
		message: new Message().addText(`“${author}”的原子阅读文章已记录~`).addImageUrl(cover ?? ''),
	});
	await ideaService(data, bot, plugin, { newFile: newFile as TFile });
};
export const locationService = async (data: any, bot: Bot, plugin: MiraiBot, appInfo: any) => {
	const meta = appInfo['meta']['Location.Search'];
	const { address, name, lat, lng } = meta;
	const file = await getNoteFile(plugin.settings);
	const note = `\n- ${window.moment().format('HH:mm')} 🚩位置记录: [${address},${name}](geo:${lat},${lng})`;
	app.vault
		.append(file as TFile, note)
		.then(() => {
			bot.sendMessage({
				friend: data.sender.id,
				message: new Message().addText('🚩位置记录下来了~'),
			});
		})
		.catch(() => {
			bot.sendMessage({
				friend: data.sender.id,
				message: new Message().addText('位置无法记录'),
			});
		});
	await ideaService(data, bot, plugin);
};

export const musicService = async (data: any, bot: Bot, plugin: MiraiBot) => {
	const { musicUrl, kind } = data.messageChain[1];
	let server: 'tencent' | 'netease';
	const id = musicUrl.match(/(?<=[\W|songm]id=)\w+/g)[0];
	if (kind === 'QQMusic') server = 'tencent';
	else if (kind === 'NeteaseCloudMusic') server = 'netease';
	else {
		bot.sendMessage({
			friend: data.sender.id,
			message: new Message().addText('暂不支持该平台的分享哦~'),
		});
		return;
	}
	if (id) {
		const file = await getNoteFile(plugin.settings);
		const iframe = `<center><iframe src='https://notion.busiyi.world/music-player/?server=${server}&type=song&id=${id}&dark'  height=100 width='80%'></iframe></center>`;
		app.vault.append(file as TFile, `\n- ${window.moment().format('HH:mm')} 🎵记录音乐: ` + iframe).then(() => {
			bot.sendMessage({
				friend: data.sender.id,
				message: new Message().addText('🎵分享的音乐记下来了~'),
			});
		});
		await ideaService(data, bot, plugin);
	}
};

export const ideaService = async (
	data: any,
	bot: Bot,
	plugin: MiraiBot,
	{ file, idea, newFile }: { file?: TFile; idea?: string; newFile?: TFile } = {},
) => {
	if (!file) file = (await getNoteFile(plugin.settings)) as TFile;
	if (!idea) idea = await data.waitFor.friend(data.sender.id).text();

	if (idea?.startsWith('想法')) {
		app.vault.append(file as TFile, '\n\t' + idea.replace(/\n/gm, '\n\t')).then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('💡想法已记录~'),
			});
		});
		if (newFile) {
			// @ts-ignore
			const { update } = app.plugins.plugins['metaedit'].api;
			await update('highlight', idea.replace('想法 ', ''), newFile);
		}
		return idea.replace('想法 ', '');
	}
};

export const testService = async (data: any, bot: Bot, plugin: MiraiBot) => {};

export const bookService = async (data: any, bot: Bot, plugin: MiraiBot) => {
	const file = await getNoteFile(plugin.settings);
	const book = data.text.replace('摘录 ', '');
	const bookFileName = book?.replace(/[\\/:*?"<>|\n]/g, '_');
	const bookFilePath = plugin.settings.tempFolder + '/' + bookFileName + '.md';
	let bookFile = app.vault.getAbstractFileByPath(bookFilePath);
	if (!bookFile) {
		const bookList = await searchDouban(book);
		if (bookList.length == 0) bookFile = await app.vault.create(bookFilePath, '');
		else {
			// const text = bookList.map((e) => e.text).join('\n');
			const message = new Message().addText('还没有创建过这本书哦，从下面选择一个创建吧~');
			await bot.sendMessage({
				friend: data.sender.id,
				message: message,
			});
			bookList.forEach(async (b) => {
				await bot.sendMessage({
					friend: data.sender.id,
					message: new Message().addText(b.text).addImageUrl(b.cover),
				});
				// message.addText(b.text).addImageUrl(b.cover);
			});
			const index = parseInt(await data.waitFor.friend(data.sender.id).text());
			if (index && index >= 1 && index <= bookList.length) {
				const infoData = await getBookInfo(bookList[index - 1].url);
				bookFile = await createNote(infoData, '📖读书', plugin, plugin.settings.templates['templateBookPath']);
			} else {
				return;
			}
		}
	} else {
		// @ts-ignore
		const { getPropertiesInFile } = app.plugins.plugins['metaedit'].api;
		const properties = (await getPropertiesInFile(bookFile))?.find((p: { key: string }) => p.key == 'banner');
		const banner = properties['content'];
		const record = `\n- ${window.moment().format('HH:mm')} 📖读书: [[${bookFileName}]]\n![|300](${banner})`;
		await app.vault.append(file as TFile, record);
	}
	await bot.sendMessage({
		friend: data.sender.id,
		message: new Message().addText('准备好做摘录了！'),
	});
	const quote: string = await data.waitFor.friend(data.sender.id).text();
	if (quote != '取消') {
		app.vault.append(bookFile as TFile, '\n\n> ' + quote).then(() => {
			bot.sendMessage({
				friend: data.sender.id,
				message: new Message().addText('✏️摘录已完成~'),
			});
		});
		await ideaService(data, bot, plugin, { file: bookFile as TFile }).then((idea) => {
			if (idea) app.vault.append(file as TFile, '\n' + idea);
		});
	}
};

export const gushiwenService = async (data: any, bot: Bot, plugin: MiraiBot) => {
	let info: string = data.text.replace(/http.*$/g, '');
	const titleMatch = info.match(/(?<=《).{1,15}(?=》$)/g);
	const title = titleMatch ? titleMatch[titleMatch.length - 1] : '';
	info = info.replace(/《.{1,15}》$/g, '');
	const authorMatch = info.match(/(?<=·).{1,10}$/g);
	const author = authorMatch ? authorMatch[0] : '';
	info = info.replace(/·.{1,10}$/g, '');
	const dynastyMatch = info.match(/(?<=— ).{1,5}$/g);
	const dynasty = dynastyMatch ? dynastyMatch[0] : '';
	const content = info.replace(/ — .{1,5}$/g, '');
	const date = window.moment().format('YYYY-MM-DD');

	const newFile = await createNote(
		{ title, author, dynasty, content, date },
		'📜古诗文',
		plugin,
		plugin.settings.templates['templatePoemPath'],
	);
	await bot.sendMessage({
		friend: data.sender.id,
		message: new Message().addText(`“${author}”的${title}已记录~`),
	});
	await ideaService(data, bot, plugin, { newFile: newFile as TFile });
};
