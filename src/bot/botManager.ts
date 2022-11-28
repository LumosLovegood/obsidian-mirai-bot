import { Bot } from 'mirai-js';
import { Notice } from 'obsidian';
import type MiraiBot from '../main';
import { generalController } from './botControllers';

export class BotManager {
	private readonly bot = new Bot();
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
		this.bot.on('FriendMessage', generalController(this.bot, this.plugin));
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
}
