import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import type MiraiBot from 'src/main';
import { getNoteFile } from 'src/scripts/utils';
import store from 'src/store';
import Component from './timeline.svelte';

export const VIEW_TYPE_BOT = 'bot-view';
export class BotView extends ItemView {
	component: Component;

	constructor(leaf: WorkspaceLeaf, readonly plugin: MiraiBot) {
		super(leaf);
		this.navigation = true;
	}

	getViewType() {
		return VIEW_TYPE_BOT;
	}
	getIcon(): string {
		return 'bot';
	}
	getDisplayText() {
		return 'Bot Timeline';
	}

	async onOpen() {
		store.plugin.set(this.plugin);
		const vaultName = app.vault.getName();

		this.component = new Component({
			target: this.contentEl,
			props: {
				vaultName,
				activities: await this.getActivities(),
			},
		});
	}

	async onClose() {
		this.component.$destroy();
	}

	async getActivities() {
		const file = await getNoteFile(this.plugin.settings);
		const noteContent = (await app.vault.read(file as TFile)).replace(
			new RegExp(`(.|\n)*${this.plugin.settings.timelineIdentifier}`),
			'',
		);
		const activities = noteContent
			.split('\n- ')
			.filter((a) => a != '\n' && a != '')
			.map((a) => {
				const internalLinkMatch = a.match(/(?<=\[\[).*(?=\]\])/);
				const internalLink = internalLinkMatch ? internalLinkMatch[0] : '';

				const sourceUrlMatch = a.match(/(?<=!\[).*(?=\|300)/);
				const sourceUrlList = sourceUrlMatch ? (sourceUrlMatch as string[]) : [];

				const imgUrlMatch = a.match(/(?<=\()http.*?(?=\))/g);
				const imgUrlList = imgUrlMatch ? (imgUrlMatch as string[]) : [];

				const musicUrlMatch = a.match(/(?<=<iframe src=').*?(?=')/);
				const musicUrl = musicUrlMatch ? musicUrlMatch[0] : '';

				const locationMatch = a.match(/(?<=\(geo:).*(?=\))/);
				const location = locationMatch ? locationMatch[0] : '';

				a = a
					.replace(/\[\[.*\]\]/g, '')
					.replace(/!?\[.*\]\(.*\)\n?/g, '')
					.replace(/<center.*center>/g, '');

				const timeRegex = a.match(/^\d\d:\d\d/);
				const time = timeRegex ? timeRegex[0] : '';

				const briefRegex = a.match(/(?<= ).*?:.*$/gm);
				const brief = briefRegex ? briefRegex[0] : '';
				const icon = brief[0];

				const infoRegex = a.match(/\n(.|\n)*/g);
				const info = (infoRegex ? infoRegex[0] : '')
					.trim()
					.replace(/\n{2,}/, '')
					.replace(/\n/g, '<br>')
					.replace('想法 ', '');
				console.log(info);
				return { time, brief, info, icon, location, musicUrl, imgUrlList, sourceUrlList, internalLink };
			});
		return activities;
	}
}
