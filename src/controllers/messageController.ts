import { Bot, Middleware } from 'mirai-js';
import { getDailyNoteFile } from 'src/utils';
import type { TFile } from 'obsidian';
import type MiraiBot from '../main';
import { wodService } from '../services/messageServices';
import {
	atomReadService,
	bilibiliService,
	bookService,
	gushiwenService,
	locationService,
	musicService,
	noteService,
	picService,
	textService,
	voiceService,
	wxoaService,
	zhihuService,
} from '../services/messageServices';

export function generalController(bot: Bot, plugin: MiraiBot) {
	return new Middleware()
		.friendFilter([plugin.settings.myQQ ?? 0])
		.textProcessor()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async (data) => {
			console.log(data);
			const dailyNote = await getDailyNoteFile();
			const message = data.messageChain[1];
			switch (message.type) {
				case 'Plain':
					await textController(data, bot, plugin, dailyNote);
					break;
				case 'Image':
					data.unlock();
					await picService(data, bot, plugin, dailyNote, true);
					break;
				case 'App':
					data.unlock();
					await appController(data, bot, plugin, dailyNote);
					break;
				case 'Quote':
					data.unlock();
					await quoteController(data, bot, plugin, dailyNote);
					break;
				case 'MusicShare':
					data.unlock();
					await musicService(data, bot, plugin, dailyNote);
					break;
				case 'Voice':
					data.unlock();
					await voiceService(data, bot, plugin, dailyNote);
					break;
				default:
					data.unlock();
					await defaultController(data, bot, plugin, dailyNote);
			}
		});
}

const quoteController = async function (data: any, bot: Bot, plugin: MiraiBot, file: TFile) {
	// console.log(data.messageChain);
	// const originData = await bot.getMessageById({ messageId: data.messageChain[1].id, target: plugin.settings.myQQ });
};

const appController = async function (data: any, bot: Bot, plugin: MiraiBot, file: TFile) {
	const appInfo = JSON.parse(data.messageChain[1]?.content);
	console.log('🚀 ~ appInfo', appInfo);
	if (appInfo.app === 'com.tencent.map') {
		await locationService(data, bot, plugin, file, appInfo);
	} else if (appInfo.app === 'com.tencent.miniapp_01') {
		const { title, qqdocurl } = appInfo?.meta?.detail_1;
		switch (title) {
			case '哔哩哔哩':
				await bilibiliService(data, bot, plugin, file, qqdocurl);
				break;
		}
	} else if (appInfo.app === 'com.tencent.structmsg') {
		const { tag, jumpUrl } = appInfo?.meta?.news;
		switch (tag) {
			case '哔哩哔哩':
				await bilibiliService(data, bot, plugin, file, jumpUrl);
				break;
			case '知乎网':
				await zhihuService(data, bot, plugin, file, jumpUrl);
				break;
			case '微信':
				await wxoaService(data, bot, plugin, file, jumpUrl);
				break;
		}
	}
};

const textController = async function (data: any, bot: Bot, plugin: MiraiBot, file: TFile) {
	if (data.text.startsWith('摘录 ')) {
		data.unlock();
		await bookService(data, bot, plugin, file);
		return;
	}
	if (data.text.endsWith('vivoBusiness=infodetail')) {
		data.unlock();
		await atomReadService(data, bot, plugin, file);
		return;
	}
	if (data.text.endsWith('https://m.gushiwen.cn/app')) {
		data.unlock();
		await gushiwenService(data, bot, plugin, file);
		return;
	}
	if (['记录', '在吗'].includes(data.text)) {
		await noteService(data, bot, plugin, file);
		return;
	}
	if ('听力' === data.text) {
		await wodService(bot, plugin, file);
		return;
	}
	if (!data.text.startsWith('想法 ')) {
		await textService(data.text, bot, plugin, file);
	}
};

const defaultController = async function (data: any, bot: Bot, plugin: MiraiBot, file: TFile) {};
