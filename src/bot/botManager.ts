import { Bot } from 'mirai-js';
import { Notice } from 'obsidian';
import MiraiBot from '../main';
import * as botEvents from './botEvents';

export class BotManager {
	private item;
	private allEvents: { [key: string]: (bot: Bot, plugin: MiraiBot) => any };
	private readonly bot = new Bot();
	private actEvents = new Map<string, number>();
	private botOn = false;

	constructor(private readonly plugin: MiraiBot) {
		this.item = plugin.addStatusBarItem();
		this.item.setText('😴BOT OFF');
		// official events
		this.allEvents = botEvents as unknown as { [key: string]: (bot: Bot, plugin: MiraiBot) => any };
		// TODO: UserScript events
	}

	async launch() {
		if (!this.plugin.settings.bot) {
			new Notice('Please complete the bot configuration first.');
			return;
		}
		if (this.botOn) await this.stop();
		// Open a session for bot
		await this.bot
			.open(this.plugin.settings.bot)
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

	// Get all functions from botEvents.ts and register them as events
	initEvents() {
		// TODO: add a setting for the default AutoStart events
		// eslint-disable-next-line no-loops/no-loops
		for (const key in this.allEvents) {
			if (Object.prototype.hasOwnProperty.call(this.allEvents, key)) {
				this.addEvent(key);
			}
		}
		this.bot.on('error', async (err) => {
			console.error(err);
			new Notice('The bot is diaconnected.');
			await this.stop();
		});
		this.bot.on('unexpected-response', async (err) => {
			console.error(err);
			new Notice('The bot is diaconnected.');
			await this.stop();
		});
	}

	removeEvent(eventName: string) {
		if (this.actEvents.get(eventName)) {
			this.bot.off('FriendMessage', this.actEvents.get(eventName));
			this.actEvents.delete(eventName);
		}
	}

	addEvent(eventName: string) {
		if (!this.actEvents.get(eventName) && this.allEvents[eventName]) {
			this.actEvents.set(
				eventName,
				this.bot.on('FriendMessage', this.allEvents[eventName](this.bot, this.plugin)),
			);
		}
	}
}
