import { Message } from 'mirai-js';
import { wodService } from './bot/botServices';
import type MiraiBot from './main';
import { getDailyNoteFile } from './utils';

export default function setTimer(plugin: MiraiBot) {
	autoCreateDailyNote('00:00', plugin);
	pushWodMessage('08:00', plugin);
}

export const autoCreateDailyNote = (time: string, plugin: MiraiBot) => {
	if (!plugin.settings.autoCreateDailyNote) return;
	return plugin.registerInterval(
		window.setTimeout(
			async () =>
				await getDailyNoteFile().then(() =>
					plugin.botManager.bot.sendMessage({
						friend: plugin.settings.myQQ,
						message: new Message().addText('今天的日记已创建~'),
					}),
				),
			(window.moment(time, 'HH:mm') as unknown as number) +
				1000 * 3600 * 24 -
				(window.moment() as unknown as number),
		),
	);
};

export const pushWodMessage = (time: string, plugin: MiraiBot) => {
	return plugin.registerInterval(
		window.setTimeout(
			async () => await wodService(plugin.botManager.bot, plugin, await getDailyNoteFile()),
			(window.moment(time, 'HH:mm') as unknown as number) +
				1000 * 3600 * 24 -
				(window.moment() as unknown as number),
		),
	);
};
