import { Bot, Message } from 'mirai-js';
import { Notice } from 'obsidian';
import type MiraiBot from './main';
import { generalController } from './controllers/messageController';
import { TimerController } from './controllers/timerController';
import { EventController } from './controllers/eventController';

export class BotManager {
	readonly bot = new Bot();
	creating: boolean;
	timerController: TimerController;
	eventController: EventController;
	private botOn = false;
	private item;

	constructor(private readonly plugin: MiraiBot) {
		this.item = plugin.addStatusBarItem();
		this.item.setText('😴BOT OFF');
	}

	async launch() {
		if (!this.plugin.settings.botConfig) {
			new Notice('Please complete the bot configuration first.');
			return;
		}
		if (this.botOn) await this.stop();
		await this.bot
			.open(this.plugin.settings.botConfig)
			.then(() => {
				new Notice('Bot has been started.');
				this.initEvents();
				this.item.setText('🔥BOT ON');
			})
			.catch((err) => {
				new Notice('Mirai is not working');
				console.error(err);
			});
		this.botOn = true;
	}

	async stop() {
		if (this.botOn)
			await this.bot.close().then(() => {
				this.botOn = false;
				new Notice('The bot has been stopped.');
				this.item.setText('😴BOT OFF');
			});
	}

	initEvents() {
		this.plugin.activateSenderPanel();
		this.plugin.addEditorMenuItem();
		this.eventController = new EventController(this.plugin);
		this.timerController = new TimerController(this.plugin, this.bot);
		this.bot.on('FriendMessage', generalController(this.bot, this.plugin));
	}

	sendMessage(message: Message) {
		this.bot.sendMessage({
			friend: this.plugin.settings.myQQ,
			message: message,
		});
	}
}
