import { Bot, Message } from 'mirai-js';
import type { TFile } from 'obsidian';
import { getAtomRead } from 'src/scripts/atomRead';
import { getBiliInfo } from 'src/scripts/bilibili';
import { getBookInfo, searchDouban } from 'src/scripts/doubanBook';
import { imgHandler, saveVoice } from 'src/utils';
import { getWxoa } from 'src/scripts/wxoa';
import { getZhihu } from 'src/scripts/zhihu';
import { getWod } from 'src/scripts/wod';
import type MiraiBot from '../main';
import { createNoteFromRecord } from '../utils';
import type { BotManager } from '../botManager';

export const noteService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
	const {
		waitFor,
		sender: { id },
	} = data;
	const vault = app.vault;
	await bot.sendMessage({ friend: id, message: new Message().addText('有在认真听~') });
	const nowTitle = '\n- ' + window.moment().format('HH:mm') + ' ✏️随笔: ';
	const message = new Message().addText('记录完成~');
	let next = await waitFor.messageChain();
	let note = next[1];
	let isFirst = true;
	// eslint-disable-next-line no-loops/no-loops
	while (note.type != 'Plain' || !['结束'].includes(note.text)) {
		if (isFirst) {
			message.addText('\n---------\n');
			vault.append(file as TFile, nowTitle);
			isFirst = false;
		}
		if (note.type === 'Plain') {
			const plain = '\n\t' + note.text.replace(/\n/g, '\n\t');
			message.addText(note.text);
			vault.append(file as TFile, plain);
		} else if (note.type === 'Image') {
			await picService(data, bot, plugin, file, false, next);
			message.addImageUrl(note.url ?? '');
		}
		next = await waitFor.messageChain();
		note = next[1];
	}
	await bot.sendMessage({ friend: id, message: message });
};

export const picService = async (
	data: any,
	bot: Bot,
	plugin: MiraiBot,
	file: TFile,
	isRercord: boolean,
	messageChain?: any,
) => {
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
	const imageUrl = await imgHandler(message.url, plugin.settings);
	let record = `\n\t![${imageUrl}|300](${imageUrl})`;
	if (isRercord) {
		record = `\n- ${window.moment().format('HH:mm')} 🎴记录图片:` + record;
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
		await ideaService(data, bot, plugin, file);
	}
};

export const bilibiliService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile, url: string) => {
	const senderId = plugin.settings.myQQ;
	const infoData = await getBiliInfo(url);
	const { cover, author } = infoData;
	if (!cover) return;
	const newFile = await createNoteFromRecord(
		infoData,
		'📺B站视频',
		plugin,
		file,
		plugin.settings.templates['templateBiliPath'],
	);
	await bot.sendMessage({
		friend: senderId,
		message: new Message().addText(`📺“${author}”的B站视频已记录√`).addImageUrl(cover),
	});
	await ideaService(data, bot, plugin, file, { newFile: newFile as TFile });
};

export const zhihuService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile, url: string) => {
	const infoData = await getZhihu(url);
	const { author, cover } = infoData;
	if (!author) return await textService(url, bot, plugin, file);
	const newFile = await createNoteFromRecord(infoData, '🔎知乎问答', plugin, file);
	let message = new Message().addText(`“${author}”的知乎回答已记录~`);
	message = cover && cover != '' ? message.addImageUrl(cover) : message;
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: message,
	});
	await ideaService(data, bot, plugin, file, { newFile: newFile as TFile });
};

export const wxoaService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile, url: string) => {
	const infoData = await getWxoa(url);
	const { author, cover } = infoData;
	if (!author) return;
	const newFile = await createNoteFromRecord(infoData, '📄微信文章', plugin, file);

	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText(`“${author}”的微信文章已记录~`).addImageUrl(cover),
	});
	await ideaService(data, bot, plugin, file, { newFile: newFile as TFile });
};

export const atomReadService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
	const url = data.text.replace(/.*\n(?=http)/g, '');
	const infoData = await getAtomRead(url);
	const { author, cover } = infoData;
	if (!author) return;
	const newFile = await createNoteFromRecord(infoData, '📄原子阅读', plugin, file);

	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText(`“${author}”的原子阅读文章已记录~`).addImageUrl(cover ?? ''),
	});
	await ideaService(data, bot, plugin, file, { newFile: newFile as TFile });
};
export const locationService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile, appInfo: any) => {
	const meta = appInfo['meta']['Location.Search'];
	const { address, name, lat, lng } = meta;
	const note = `\n- ${window.moment().format('HH:mm')} 🚩位置记录: [${address},${name}](geo:${lat},${lng})`;
	app.vault
		.append(file as TFile, note)
		.then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('🚩位置记录下来了~'),
			});
		})
		.catch(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('位置无法记录'),
			});
		});
	await ideaService(data, bot, plugin, file);
};

export const musicService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
	const { musicUrl, kind } = data.messageChain[1];
	let server: 'tencent' | 'netease';
	const id = musicUrl.match(/(?<=[\W|songm]id=)\w+/g)[0];
	if (kind === 'QQMusic') server = 'tencent';
	else if (kind === 'NeteaseCloudMusic') server = 'netease';
	else {
		bot.sendMessage({
			friend: plugin.settings.myQQ,
			message: new Message().addText('暂不支持该平台的分享哦~'),
		});
		return;
	}
	if (id) {
		const iframe = `<center><iframe src='https://notion.busiyi.world/music-player/?server=${server}&type=song&id=${id}&dark'  height=100 width='80%'></iframe></center>`;
		app.vault.append(file as TFile, `\n- ${window.moment().format('HH:mm')} 🎵记录音乐: \n` + iframe).then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('🎵分享的音乐记下来了~'),
			});
		});
		await ideaService(data, bot, plugin, file);
	}
};

export const ideaService = async (
	data: any,
	bot: Bot,
	plugin: MiraiBot,
	file: TFile,
	{ idea, newFile }: { idea?: string; newFile?: TFile } = {},
) => {
	if (!idea) idea = await data.waitFor.friend(plugin.settings.myQQ).text();

	if (idea?.startsWith('想法')) {
		app.vault.append(file as TFile, '\n\t' + idea.replace(/\n/gm, '\n\t')).then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('💡想法已记录~'),
			});
		});
		if (newFile) {
			const { update } = app.plugins.plugins['metaedit'].api;
			await update('highlight', idea.replace('想法 ', ''), newFile);
		}
		return idea.replace('想法 ', '');
	}
};

export const textService = async (text: string, bot: Bot, plugin: MiraiBot, file: TFile, title = '📒记录文本') => {
	app.vault.append(file as TFile, `\n- ${window.moment().format('HH:mm')} ${title}: \n\t` + text?.trim()).then(() => {
		bot.sendMessage({
			friend: plugin.settings.myQQ,
			message: new Message().addText('消息已记录~'),
		});
	});
};

export const bookService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
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
				friend: plugin.settings.myQQ,
				message: message,
			});
			bookList.forEach(async (b) => {
				await bot.sendMessage({
					friend: plugin.settings.myQQ,
					message: new Message().addText(b.text).addImageUrl(b.cover),
				});
				// message.addText(b.text).addImageUrl(b.cover);
			});
			const index = parseInt(await data.waitFor.friend(plugin.settings.myQQ).text());
			if (index && index >= 1 && index <= bookList.length) {
				const infoData = await getBookInfo(bookList[index - 1].url);
				bookFile = await createNoteFromRecord(
					infoData,
					'📖读书',
					plugin,
					file,
					plugin.settings.templates['templateBookPath'],
				);
			} else {
				return;
			}
		}
	} else {
		const { getPropertiesInFile } = app.plugins.plugins['metaedit'].api;
		const properties = (await getPropertiesInFile(bookFile as TFile))?.find(
			(p: { key: string }) => p.key == 'banner',
		);
		const banner = properties['content'];
		const record = `\n- ${window.moment().format('HH:mm')} 📖读书: [[${bookFileName}]]\n![|300](${banner})`;
		await app.vault.append(file as TFile, record);
	}
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText('准备好做摘录了！'),
	});
	const quote: string = await data.waitFor.friend(plugin.settings.myQQ).text();
	if (quote != '取消') {
		app.vault.append(bookFile as TFile, '\n\n> ' + quote).then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('✏️摘录已完成~'),
			});
		});
		await ideaService(data, bot, plugin, bookFile as TFile).then((idea) => {
			if (idea) app.vault.append(file as TFile, '\n' + idea);
		});
	}
};

export const gushiwenService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
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

	const newFile = await createNoteFromRecord(
		{ title, author, dynasty, content, date },
		'📜古诗文',
		plugin,
		file,
		plugin.settings.templates['templatePoemPath'],
	);
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText(`“${author}”的${title}已记录~`),
	});
	await ideaService(data, bot, plugin, file, { newFile: newFile as TFile });
};

export const voiceService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
	const url = data.messageChain[1].url;
	const voicePath = await saveVoice(url, plugin.settings);
	const record = `\n- ${window.moment().format('HH:mm')} 💬记录语音:\n\t![audio](${voicePath})`;
	await app.vault.append(file as TFile, record);
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText('语音已记录~'),
	});
	await ideaService(data, bot, plugin, file);
};

export const wodService = async (bot: Bot, plugin: MiraiBot, file: TFile) => {
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText('每日一词获取中~'),
	});
	const wodData = await getWod(plugin.settings);
	await createNoteFromRecord(wodData, '🔤每日单词', plugin, file, plugin.settings.templates['templateWodPath']);
	const { voicePath, cover, description } = wodData;
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addImageUrl(cover ?? '').addText(description ?? ''),
	});
	console.log('voicePath', voicePath);
	bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addVoicePath(voicePath?.replace(/\\/g, '/') ?? ''),
	});
};

export const sendToMe = async (content: string, botManager: BotManager) => {
	const imgReg = /!\[.*?\]\((.*?)\)/gm;
	console.log(content);
	content = content.replace(imgReg, (...args) => {
		botManager.sendMessage(new Message().addImageUrl(args[1]));
		return '';
	});
	content = content
		.replace(/\[\[(.*?)\]\]/, (...args) => {
			return args[1];
		})
		.trim();
	if (content != '') botManager.sendMessage(new Message().addText(content));
};
