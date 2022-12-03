import { type Bot, Message } from 'mirai-js';
import type { TFile } from 'obsidian';
import type MiraiBot from 'src/main';
import { getAtomRead } from 'src/scripts/atomRead';
import { getBiliInfo } from 'src/scripts/bilibili';
import { getWxoa } from 'src/scripts/wxoa';
import { getZhihu } from 'src/scripts/zhihu';
import { createNoteFromRecord } from 'src/utils';
import { tempTextService } from './textMessage';
import { ideaService } from './textMessage';

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
	if (!author) return await tempTextService(url, bot, plugin, file);
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

export const musicService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
	const { musicUrl, kind, title, jumpUrl } = data.messageChain[1];
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
		app.vault
			.append(
				file as TFile,
				`\n- ${window.moment().format('HH:mm')} 🎵记录音乐: [${title}](${jumpUrl})\n` + iframe,
			)
			.then(() => {
				bot.sendMessage({
					friend: plugin.settings.myQQ,
					message: new Message().addText('🎵分享的音乐记下来了~'),
				});
			});
		await ideaService(data, bot, plugin, file);
	}
};
