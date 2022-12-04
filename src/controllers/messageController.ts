import { Middleware } from 'mirai-js';
import { textService } from 'src/services/textSeivice';
import { bookService } from 'src/services/commandService';
import {
	atomReadService,
	bilibiliService,
	gushiwenService,
	musicService,
	wxoaService,
	zhihuService,
} from 'src/services/shareService';
import { wodService } from '../services/subscriptionService';
import { locationService, picService, voiceService } from '../services/mediaService';
import type { BotManager } from '../botManager';
import type { WaitFor } from '../type';

export function messageController(botManager: BotManager) {
	const qq = app.plugins.plugins['obsidian-mirai-bot'].settings.myQQ;
	return new Middleware()
		.friendFilter([qq ?? 0])
		.textProcessor()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async (data) => {
			console.log(data);
			const message = data.messageChain[1];
			botManager.creating = true;
			switch (message.type) {
				case 'Plain':
					await plainController(data.text, data.waitFor, data.unlock);
					break;
				case 'Image':
					data.unlock();
					await picService(true, data.messageChain);
					break;
				case 'App':
					data.unlock();
					await appController(data);
					break;
				case 'Quote':
					data.unlock();
					await quoteController(data);
					break;
				case 'MusicShare':
					data.unlock();
					await musicService(data.messageChain[1]);
					break;
				case 'Voice':
					data.unlock();
					await voiceService(data.messageChain[1].url);
					break;
				default:
					data.unlock();
					await defaultController(data);
			}
			botManager.creating = false;
		});
}

const appController = async function (data: any) {
	const appInfo = JSON.parse(data.messageChain[1]?.content);
	console.log('🚀 ~ appInfo', appInfo);
	if (appInfo.app === 'com.tencent.map') {
		await locationService(appInfo);
	} else if (appInfo.app === 'com.tencent.miniapp_01') {
		const { title, qqdocurl } = appInfo?.meta?.detail_1;
		switch (title) {
			case '哔哩哔哩':
				await bilibiliService(qqdocurl);
				break;
		}
	} else if (appInfo.app === 'com.tencent.structmsg') {
		const { tag, jumpUrl } = appInfo?.meta?.news;
		switch (tag) {
			case '哔哩哔哩':
				await bilibiliService(jumpUrl);
				break;
			case '知乎网':
				await zhihuService(jumpUrl);
				break;
			case '微信':
				await wxoaService(jumpUrl);
				break;
		}
	}
};

export const plainController = async function (text: string, waitFor?: any, unlock?: any) {
	if (text.startsWith('@')) return await commandController(text.replace('@', ''), waitFor);
	if (unlock) unlock();
	await textController(text);
};

const commandController = async function (command: string, waitFor?: WaitFor) {
	if (command.startsWith('摘录 ')) {
		await bookService(command.replace('摘录 ', ''), waitFor);
		return;
	}
};
const textController = async function (text: string) {
	if (text.endsWith('vivoBusiness=infodetail')) {
		await atomReadService(text);
		return;
	}
	if (text.endsWith('https://m.gushiwen.cn/app')) {
		await gushiwenService(text);
		return;
	}
	if ('听力' === text) {
		await wodService();
		return;
	}
	await textService(text);
};

const defaultController = async function (data: any) {};
const quoteController = async function (data: any) {
	// console.log(data.messageChain);
	// const originData = await bot.getMessageById({ messageId: data.messageChain[1].id, target: plugin.settings.myQQ });
};
