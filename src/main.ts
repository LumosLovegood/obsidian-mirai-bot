import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, MiraiBotSettingTab } from './gui/miraiBotSettingTab';
import { BotManager } from './bot/botManager';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { t } from './lib/lang';
import { log, logging } from './lib/logging';
import { BotView, VIEW_TYPE_BOT } from './view/botView';
import { createBotFolder } from './utils';
import setTimer from './timer';
import type { MiraiBotSettings, Parameters } from './type';
import { protocolHandler } from './protocolHandlers';

export default class MiraiBot extends Plugin {
	settings: MiraiBotSettings;
	public botManager: BotManager = new BotManager(this);

	async onload() {
		logging.registerConsoleLogger();

		log('info', `loading plugin "${this.manifest.name}" v${this.manifest.version}`);

		await this.loadSettings();
		await createBotFolder();
		this.registerView(VIEW_TYPE_BOT, (leaf) => new BotView(leaf, this));

		this.addRibbonIcon('bot', 'Bot Timeline', () => this.activateBotView());

		this.addCommand({
			id: 'open-bot',
			name: 'Launch the bot.',
			callback: () => this.botManager.launch(),
		});

		this.addCommand({
			id: 'close-bot',
			name: 'Stop the Bot',
			callback: () => this.botManager.stop(),
		});

		this.addCommand({
			id: 'open-timeline-view',
			name: 'Open Bot Timeline',
			callback: () => this.activateBotView(),
		});

		this.addSettingTab(new MiraiBotSettingTab(this));
		if (this.settings.autoLaunch) this.botManager.launch();

		this.registerObsidianProtocolHandler('mirai-bot', async (e) => {
			await protocolHandler(e as unknown as Parameters, this.settings);
		});

		setTimer(this);
	}

	async onunload() {
		log('info', `unloading plugin "${this.manifest.name}" v${this.manifest.version}`);
		await this.botManager.stop();
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_BOT);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateBotView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_BOT);
		await this.app.workspace.getLeaf(false).setViewState({
			type: VIEW_TYPE_BOT,
			active: true,
		});
		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_BOT)[0]);
	}
}
