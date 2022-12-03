import { Bot, Message } from 'mirai-js';
import { autoCreateDiary } from 'src/services/createDiaryTimer';
import type MiraiBot from '../main';
import { getDailyNoteFile } from '../utils';
import { wodService } from '../services/subscriptions';

export class TimerController {
	constructor(private readonly plugin: MiraiBot, private readonly bot: Bot) {
		this.init();
	}

	init() {
		this.addTimer('00:00', async (bot, plugin) => {
			await autoCreateDiary().then(() =>
				bot.sendMessage({
					friend: plugin.settings.myQQ,
					message: new Message().addText('今天的日记已创建~'),
				}),
			);
		});
		this.addTimer('08:00', async (bot, plugin) => await wodService(bot, plugin, await getDailyNoteFile()));
	}

	addTimer(time: string, callout: (bot: Bot, plugin: MiraiBot) => any) {
		const interval = (window.moment(time, 'HH:mm') as unknown as number) - (window.moment() as unknown as number);
		return this.plugin.registerInterval(
			window.setTimeout(
				() => callout(this.bot, this.plugin),
				interval >= 0 ? interval : interval + 1000 * 3600 * 24,
			),
		);
	}
}
