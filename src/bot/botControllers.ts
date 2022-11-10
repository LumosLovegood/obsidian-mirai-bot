import { Bot, Middleware } from 'mirai-js';
import MiraiBot from '../main';
import { bilibiliService, noteService, picService } from './botServices';

export const bilibiliController = function (bot: Bot, plugin: MiraiBot) {
	return new Middleware().textProcessor().done(async (data) => {
		const target = data.text.match(/https?:\/\/((www|m)\.bilibili\.com\/video\/\S*\?|b23\.tv\/\S*)/gm);
		if (target) {
			await bilibiliService(data, bot, plugin, target[0]);
		}
	});
};

// if (message.type == 'App') console.log(JSON.parse(message.content));
// else console.log(data);
export const picController = function (bot: Bot, plugin: MiraiBot) {
	return new Middleware()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async (data) => {
			const message = data.messageChain[1];
			if (message?.type === 'Image') {
				await picService(data, bot, plugin);
			}
		});
};

export const noteController = function (bot: Bot, plugin: MiraiBot) {
	return new Middleware()
		.textProcessor()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async (data) => {
			if (['写点东西', '记点东西', '在吗'].includes(data.text)) {
				await noteService(data, bot, plugin);
			}
		});
};
