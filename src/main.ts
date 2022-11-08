import { Editor, MarkdownView, Plugin } from 'obsidian';
import { createTimeLine } from './command/uptimerCommand';
import { UptimerApi } from './api/uptimerApi';
import { DEFAULT_SETTINGS, MiraiBotSettingTab, MiraiBotSettings } from './gui/miraiBotSettingTab';
import { BotManager } from './bot/botManager';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { t } from './lib/lang';
import { log, logging } from './lib/logging';

export default class MiraiBot extends Plugin {
	settings: MiraiBotSettings;
	public uptimerApi: UptimerApi;
	public botManager: BotManager = new BotManager(this);

	async onload() {
		logging.registerConsoleLogger();

		log('info', `loading plugin "${this.manifest.name}" v${this.manifest.version}`);

		await this.loadSettings();
		// 在右键菜单中注册命令：将选中的文字创建微软待办
		// Register command in the context menu: Create to Do with the selected text
		this.addCommand({
			id: 'add-uptimer',
			name: 'Insert the uptimer Timeline.',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await createTimeLine(this.uptimerApi, editor);
			},
		});

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
			id: 'remove-event',
			name: 'Remove event',
			callback: () => {
				this.botManager.removeEvent('echo');
			},
		});

		this.addCommand({
			id: 'add-event',
			name: 'Add event',
			callback: () => {
				this.botManager.addEvent('echo');
			},
		});

		this.addSettingTab(new MiraiBotSettingTab(this));
		if (this.settings.uptimer?.token != undefined) {
			this.uptimerApi = new UptimerApi(this.settings.uptimer.token);
		}
		if (this.settings.bot?.autoLaunch) this.botManager.launch();

		// const a = this.app.vault.getAbstractFileByPath('0进行中/00Today/未命名 2.md')
		// if(a) await this.app.vault.append(a,"hello")
		this.registerInterval(
			window.setTimeout(
				() =>
					// @ts-ignore
					this.app.commands.executeCommandById('periodic-notes:open-daily-note'),
				(window.moment('00:01', 'HH:mm') as unknown as number) - (window.moment() as unknown as number),
			),
		);
		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// });
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// console.log(await this.todoApi.getListIdByName("obsidian"))
	}

	async onunload() {
		log('info', `unloading plugin "${this.manifest.name}" v${this.manifest.version}`);
		await this.botManager.stop();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
