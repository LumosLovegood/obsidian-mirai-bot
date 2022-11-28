import { Notice, PluginSettingTab, Setting } from 'obsidian';
import type { MiraiBotSettings } from 'src/type';
import type MiraiBot from '../main';
import { t } from '../lib/lang';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { LogOptions, log } from '../lib/logging';

export const DEFAULT_SETTINGS: MiraiBotSettings = {
	botConfig: {
		baseUrl: 'http://localhost:10010',
		verifyKey: '',
		qq: undefined,
	},
	myQQ: undefined,
	note: {
		folder: '',
		format: 'YYYY-MM-DD',
		stayWithPN: false,
	},
	autoCreateDailyNote: false,
	autoLaunch: false,
	tempFolder: '',
	loggingOptions: {
		minLevels: {
			'': 'info',
		},
	},
	timelineIdentifier: '#### 一些随笔',
	templates: {
		templateNotePath: '',
		templateBookPath: '',
	},
	enableImageUpload: false,
	imageFolder: 'Attachments',
	youzackIndex: 1,
};

export class MiraiBotSettingTab extends PluginSettingTab {
	plugin: MiraiBot;
	settings: MiraiBotSettings;

	constructor(plugin: MiraiBot) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.settings;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h1', {
			text: `${this.plugin.manifest.name}`,
		});
		const span = containerEl.createSpan();
		span.style.fontSize = '0.8em';
		span.innerHTML = `Version ${this.plugin.manifest.version} <br /> ${this.plugin.manifest.description} created by ${this.plugin.manifest.author}.`;
		containerEl.createEl('h3', { text: 'MiraiBot配置连接' });
		new Setting(containerEl)
			.setName('Bot连接地址')
			.setDesc('连接到Bot的BaseUrl')
			.addText((text) =>
				text.setValue(this.settings.botConfig.baseUrl ?? '').onChange(async (value) => {
					this.settings.botConfig.baseUrl = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName('Bot验证密钥')
			.setDesc('连接到Bot需要的verifyKey')
			.addText((text) =>
				text.setValue(this.settings.botConfig.verifyKey ?? '').onChange(async (value) => {
					this.settings.botConfig.verifyKey = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl).setName('Bot的QQ号码').addText((text) =>
			text.setValue(this.settings.botConfig.qq?.toString() ?? '').onChange(async (value) => {
				this.settings.botConfig.qq = parseInt(value);
				await this.plugin.saveSettings();
			}),
		);
		new Setting(containerEl)
			.setName('自己的QQ号码')
			.setDesc('在Bot中过滤自己的消息，避免他人误触')
			.addText((text) =>
				text.setValue(this.settings.myQQ?.toString() ?? '').onChange(async (value) => {
					this.settings.myQQ = parseInt(value);
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl).setName('Bot自启动').addToggle((toggle) =>
			toggle.setValue(this.settings.autoLaunch).onChange(async (value) => {
				this.settings.autoLaunch = value;
				await this.plugin.saveSettings();
			}),
		);

		containerEl.createEl('h3', { text: t('Settings_JournalFormatting') });
		new Setting(containerEl).setName(t('Settings_JournalFormatting_PeriodicNotes')).addToggle((toggle) =>
			toggle.setValue(this.settings.note.stayWithPN).onChange(async (value) => {
				if (value) {
					const PNsetting = app.plugins.plugins['periodic-notes'];
					if (PNsetting) {
						const { format, folder } = PNsetting.settings.daily;
						this.settings.note = {
							format,
							folder,
							stayWithPN: true,
						};
						console.log('🚀 ~ this.settings.diary', this.settings.note);
						await this.plugin.saveSettings();
						this.display();
					} else {
						new Notice('Periodic Notes 中未设置');
						this.display();
					}
				} else {
					this.settings.note.stayWithPN = false;
					await this.plugin.saveSettings();
					this.display();
				}
			}),
		);

		new Setting(containerEl)
			.setName('日记文件夹')
			.addText((text) =>
				text.setValue(this.settings.note.folder).onChange(async (value) => {
					this.settings.note.folder = value;
					await this.plugin.saveSettings();
				}),
			)
			.setDisabled(this.settings.note.stayWithPN);

		const notePath = new Setting(containerEl)
			.setName('日记格式')
			.setDesc(
				`${t('Settings_JournalFormatting_DateFormatDescription')}  ${
					!this.settings.note.format ? '' : window.moment().format(this.settings.note.format)
				}`,
			)
			.addText((text) =>
				text.setValue(this.settings.note.format).onChange(async (value) => {
					this.settings.note.format = value;
					notePath.setDesc(
						`${t('Settings_JournalFormatting_DateFormatDescription')}  ${
							!this.settings.note.format ? '' : window.moment().format(this.settings.note.format)
						}`,
					);
					await this.plugin.saveSettings();
				}),
			)
			.setDisabled(this.settings.note.stayWithPN);

		new Setting(containerEl)
			.setName('临时文件夹')
			.setDesc('将生成的新笔记存放于此')
			.addText((text) =>
				text.setValue(this.settings.tempFolder).onChange(async (value) => {
					this.settings.tempFolder = value;
					await this.plugin.saveSettings();
				}),
			);
	}

	async hide() {}
}
