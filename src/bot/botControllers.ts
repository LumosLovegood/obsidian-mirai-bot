import { Bot, Middleware } from 'mirai-js';
import type MiraiBot from '../main';
import {
	atomReadService,
	bilibiliService,
	bookService,
	ideaService,
	locationService,
	musicService,
	noteService,
	picService,
	testService,
	wxoaService,
	zhihuService,
} from './botServices';

export function generalController(bot: Bot, plugin: MiraiBot) {
	return new Middleware()
		.friendFilter([plugin.settings.myQQ ?? 0])
		.textProcessor()
		.syncWrapper()
		.done(async (data) => {
			console.log(data);
			const message = data.messageChain[1];
			switch (message.type) {
				case 'Plain':
					await textController(data, bot, plugin);
					break;
				case 'Image':
					await picService(data, bot, plugin, 'note');
					break;
				case 'App':
					await appController(data, bot, plugin);
					break;
				case 'Quote':
					await quoteController(data, bot, plugin);
					break;
				case 'MusicShare':
					await musicService(data, bot, plugin);
					break;
				default:
					await defaultController(data, bot, plugin);
			}
		});
}

export function commandController(bot: Bot, plugin: MiraiBot) {
	return new Middleware()
		.friendFilter([plugin.settings.myQQ ?? 0])
		.textProcessor()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async (data) => {
			if (['写点东西', '记点东西', '在吗'].includes(data.text)) {
				await noteService(data, bot, plugin);
				return;
			}
			if (data.text === '测试') {
				await testService(data, bot, plugin);
				return;
			}
		});
}

const quoteController = async function (data: any, bot: Bot, plugin: MiraiBot) {
	const originData = await bot.getMessageById({ messageId: data.messageChain[1].id, target: data.sender.id });
	const type = originData.messageChain[1]?.type;
	switch (type) {
		case 'Image':
			if (data.text === '封面') {
				await picService(originData, bot, plugin, 'banner');
			}
			break;
		case 'App':
			await ideaService(data, bot, undefined, plugin);
			break;
	}
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
		await bookService(data, bot, plugin);
		return;
	}
	if (data.text.endsWith('vivoBusiness=infodetail')) {
		await atomReadService(data, bot, plugin);
	}
};

const defaultController = async function (data: any, bot: Bot, plugin: MiraiBot) {};
