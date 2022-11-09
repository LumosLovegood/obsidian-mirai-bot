import { Notice, PluginSettingTab, Setting } from 'obsidian';
import { getUptimerToken } from '../api/uptimerApi';
import MiraiBot from '../main';
import { t } from '../lib/lang';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LogOptions, log } from '../lib/logging';

export interface MiraiBotSettings {
	uptimer: {
		email: string | undefined;
		password: string | undefined;
		token: string | undefined;
	};
	botConfig:
		| {
				baseUrl: string;
				verifyKey: string;
				qq: number | undefined;
		  }
		| undefined;
	autoLaunch: boolean;
	note: {
		folder: string;
		format: string;
		stayWithPN: boolean;
	};

	// Logging options.
	loggingOptions: LogOptions;
}

export const DEFAULT_SETTINGS: MiraiBotSettings = {
	uptimer: {
		email: undefined,
		password: undefined,
		token: undefined,
	},
	botConfig: undefined,
	note: {
		folder: '',
		format: 'Inbox',
		stayWithPN: false,
	},
	autoLaunch: false,
	loggingOptions: {
		minLevels: {
			'': 'info',
		},
	},
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

		containerEl.createEl('h3', { text: t('Settings_Uptimer') });

		new Setting(containerEl).setName(t('Settings_Uptimer_UpTimerEmail')).addText((text) =>
			text.setValue(this.settings.uptimer.email ?? '').onChange(async (value) => {
				console.log('Secret: ' + value);
				this.settings.uptimer.email = value;
				await this.plugin.saveSettings();
			}),
		);

		new Setting(containerEl).setName(t('Settings_Uptimer_UpTimerPassword')).addText((text) =>
			text.setValue(this.settings.uptimer.password ?? '').onChange(async (value) => {
				this.settings.uptimer.password = value;
				await this.plugin.saveSettings();
			}),
		);

		containerEl.createEl('h3', { text: t('Settings_JournalFormatting') });
		new Setting(containerEl).setName(t('Settings_JournalFormatting_PeriodicNotes')).addToggle((toggle) =>
			toggle.setValue(this.settings.note.stayWithPN).onChange(async (value) => {
				if (value) {
					// @ts-ignore
					const PNsetting =
						// @ts-ignore
						app.plugins.plugins['periodic-notes'];
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
			.setName(t('Settings_JournalFormatting_DateFormat'))
			.setDesc(`${t('Settings_JournalFormatting_DateFormatDescription')}`)
			.addText((text) =>
				text.setValue(this.settings.note.folder).onChange(async (value) => {
					this.settings.note.folder = value;
					await this.plugin.saveSettings();
				}),
			)
			.setDisabled(this.settings.note.stayWithPN);

		const notePath = new Setting(containerEl)
			.setName(t('Settings_JournalFormatting_DateFormat'))
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
	}

	async hide() {
		const email = this.settings.uptimer.email;
		const password = this.settings.uptimer.password;

		if (!this.settings.uptimer.token) {
			if (!email || !password) new Notice('uptimer未设置');
			else {
				const token = await getUptimerToken(email, password);
				if (!token) {
					new Notice('邮箱或密码错误');
				}
				this.settings.uptimer.token = token;
				new Notice('uptimer已配置完成√');
				await this.plugin.saveSettings();
			}
		}
	}
}
