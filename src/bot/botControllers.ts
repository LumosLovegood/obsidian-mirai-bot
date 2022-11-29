import { Bot, Middleware } from 'mirai-js';
import type MiraiBot from '../main';
import { wodService } from './botServices';
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
} from './botServices';

export function generalController(bot: Bot, plugin: MiraiBot) {
	return new Middleware()
		.friendFilter([plugin.settings.myQQ ?? 0])
		.textProcessor()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async (data) => {
			console.log(data);
			const message = data.messageChain[1];
			switch (message.type) {
				case 'Plain':
					await textController(data, bot, plugin);
					break;
				case 'Image':
					data.unlock();
					await picService(data, bot, plugin, true);
					break;
				case 'App':
					data.unlock();
					await appController(data, bot, plugin);
					break;
				case 'Quote':
					data.unlock();
					await quoteController(data, bot, plugin);
					break;
				case 'MusicShare':
					data.unlock();
					await musicService(data, bot, plugin);
					break;
				case 'Voice':
					data.unlock();
					await voiceService(data, bot, plugin);
					break;
				default:
					data.unlock();
					await defaultController(data, bot, plugin);
			}
		});
}

const quoteController = async function (data: any, bot: Bot, plugin: MiraiBot) {
	// console.log(data.messageChain);
	// const originData = await bot.getMessageById({ messageId: data.messageChain[1].id, target: plugin.settings.myQQ });
};

const appController = async function (data: any, bot: Bot, plugin: MiraiBot) {
	const appInfo = JSON.parse(data.messageChain[1]?.content);
	console.log('🚀 ~ appInfo', appInfo);
	if (appInfo.app === 'com.tencent.map') {
		await locationService(data, bot, plugin, appInfo);
	} else if (appInfo.app === 'com.tencent.miniapp_01') {
		const { title, qqdocurl } = appInfo?.meta?.detail_1;
		switch (title) {
			case '哔哩哔哩':
				await bilibiliService(data, bot, plugin, qqdocurl);
				break;
		}
	} else if (appInfo.app === 'com.tencent.structmsg') {
		const { tag, jumpUrl } = appInfo?.meta?.news;
		switch (tag) {
			case '哔哩哔哩':
				await bilibiliService(data, bot, plugin, jumpUrl);
				break;
			case '知乎网':
				await zhihuService(data, bot, plugin, jumpUrl);
				break;
			case '微信':
				await wxoaService(data, bot, plugin, jumpUrl);
				break;
		}
	}
};

const textController = async function (data: any, bot: Bot, plugin: MiraiBot) {
	if (data.text.startsWith('摘录 ')) {
		data.unlock();
		await bookService(data, bot, plugin);
		return;
	}
	if (data.text.endsWith('vivoBusiness=infodetail')) {
		data.unlock();
		await atomReadService(data, bot, plugin);
		return;
	}
	if (data.text.endsWith('https://m.gushiwen.cn/app')) {
		data.unlock();
		await gushiwenService(data, bot, plugin);
		return;
	}
	if (['记录', '在吗'].includes(data.text)) {
		await noteService(data, bot, plugin);
		return;
	}
	if ('听力' === data.text) {
		await wodService(bot, plugin);
		return;
	}
	if (!data.text.startsWith('想法 ')) {
		await textService(data.text, bot, plugin);
	}
};

const defaultController = async function (data: any, bot: Bot, plugin: MiraiBot) {};
