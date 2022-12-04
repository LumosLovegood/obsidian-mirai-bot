import { Bot, Middleware } from 'mirai-js';
import { textService } from 'src/services/textMessage';
import { bookService } from 'src/services/textMessage';
import {
	atomReadService,
	bilibiliService,
	gushiwenService,
	musicService,
	wxoaService,
	zhihuService,
} from 'src/services/appShareMessage';
import type MiraiBot from '../main';
import { wodService } from '../services/subscriptions';
import { locationService, picService, voiceService } from '../services/mediaMessage';

export function generalController(bot: Bot, plugin: MiraiBot) {
	return (
		new Middleware()
			// @ts-ignore
			.friendFilter([window.senderID])
			.textProcessor()
			.friendLock({ autoUnlock: true })
			.syncWrapper()
			.done(async (data) => {
				console.log(data);
				const message = data.messageChain[1];
				plugin.botManager.creating = true;
				switch (message.type) {
					case 'Plain':
						await textController(data, plugin);
						break;
					case 'Image':
						data.unlock();
						await picService(plugin, true, data.messageChain);
						break;
					case 'App':
						data.unlock();
						await appController(data, plugin);
						break;
					case 'Quote':
						data.unlock();
						await quoteController(data, bot, plugin);
						break;
					case 'MusicShare':
						data.unlock();
						await musicService(data.messageChain[1]);
						break;
					case 'Voice':
						data.unlock();
						await voiceService(plugin, data.messageChain[1].url);
						break;
					default:
						data.unlock();
						await defaultController(data, bot, plugin);
				}
				plugin.botManager.creating = false;
			})
	);
}

const appController = async function (data: any, plugin: MiraiBot) {
	const appInfo = JSON.parse(data.messageChain[1]?.content);
	console.log('🚀 ~ appInfo', appInfo);
	if (appInfo.app === 'com.tencent.map') {
		await locationService(appInfo);
	} else if (appInfo.app === 'com.tencent.miniapp_01') {
		const { title, qqdocurl } = appInfo?.meta?.detail_1;
		switch (title) {
			case '哔哩哔哩':
				await bilibiliService(plugin, qqdocurl);
				break;
		}
	} else if (appInfo.app === 'com.tencent.structmsg') {
		const { tag, jumpUrl } = appInfo?.meta?.news;
		switch (tag) {
			case '哔哩哔哩':
				await bilibiliService(plugin, jumpUrl);
				break;
			case '知乎网':
				await zhihuService(plugin, jumpUrl);
				break;
			case '微信':
				await wxoaService(plugin, jumpUrl);
				break;
		}
	}
};

const textController = async function (data: any, plugin: MiraiBot) {
	if (data.text.startsWith('摘录 ')) {
		await bookService(data.text.replace('摘录 ', ''), data.waitFor, plugin);
		return;
	}
	if (data.text.endsWith('vivoBusiness=infodetail')) {
		data.unlock();
		await atomReadService(plugin, data.text);
		return;
	}
	if (data.text.endsWith('https://m.gushiwen.cn/app')) {
		data.unlock();
		await gushiwenService(plugin, data.text);
		return;
	}
	if ('听力' === data.text) {
		await wodService(plugin);
		return;
	}
	await textService(data.text);
};

const defaultController = async function (data: any, bot: Bot, plugin: MiraiBot) {};
const quoteController = async function (data: any, bot: Bot, plugin: MiraiBot) {
	// console.log(data.messageChain);
	// const originData = await bot.getMessageById({ messageId: data.messageChain[1].id, target: plugin.settings.myQQ });
};
