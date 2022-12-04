import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, MiraiBotSettingTab } from './views/miraiBotSettingTab';
import { BotManager } from './botManager';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { t } from './libs/lang';
import { log, logging } from './libs/logging';
import { BotView, VIEW_TYPE_BOT } from './views/activitiesView';
import { createBotFolder } from './utils';
import type { MiraiBotSettings, Parameters } from './type';
import { protocolHandler } from './controllers/protocolController';
import { BotPanel, VIEW_TYPE_BOT_PANEL } from './views/senderPanel';
import { sendToMe } from './services/sentToMe';
import { plainController } from './controllers/messageController';

export default class MiraiBot extends Plugin {
	settings: MiraiBotSettings;
	botManager: BotManager = new BotManager(this);

	async onload() {
		logging.registerConsoleLogger();

		log('info', `loading plugin "${this.manifest.name}" v${this.manifest.version}`);

		await this.loadSettings();
		await createBotFolder();

		this.registerView(VIEW_TYPE_BOT, (leaf) => new BotView(leaf, this));
		this.registerView(VIEW_TYPE_BOT_PANEL, (leaf) => new BotPanel(leaf, this));

		this.addRibbonIcon('bot', 'Bot Timeline', () => this.activateBotView());
		this.addRibbonIcon('dice', '测试', () => plainController('@摘录 朝花夕拾'));

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
		await this.app.workspace.getLeaf(true).setViewState({
			type: VIEW_TYPE_BOT,
			active: true,
		});
		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_BOT)[0]);
	}
	async activateSenderPanel() {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE_BOT_PANEL).length === 0) {
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: VIEW_TYPE_BOT_PANEL,
			});
		}
		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_BOT_PANEL)[0]);
	}
	addEditorMenuItem() {
		this.registerEvent(
			app.workspace.on('editor-menu', (menu, editor, view) => {
				let selection = editor.getSelection();
				const cursorLocation = editor.getCursor();
				if (!selection || selection === '') selection = editor.getLine(cursorLocation.line);
				menu.addItem((item) => {
					item.setTitle('通过Bot发送').onClick(async () => await sendToMe(selection));
				});
			}),
		);
	}
}
