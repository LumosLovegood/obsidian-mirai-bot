import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import type MiraiBot from 'src/main';
import { getDailyNote } from 'src/utils';
import store from 'src/store';
import { getRealFilePath } from '../utils';
import type { ActivityRecord, RecordDetail } from '../type';
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

		this.component = new Component({
			target: this.contentEl,
			props: {
				activities: await this.getActivities(),
			},
		});
	}

	async onClose() {
		this.component.$destroy();
	}

	async getActivities() {
		const vaultName = encodeURI(app.vault.getName());
		const file = await getDailyNote(this.plugin.settings);
		const records = (await app.vault.read(file as TFile)).replace(
			new RegExp(`.*${this.plugin.settings.timelineIdentifier}`, 's'),
			'',
		);
		let activities: ActivityRecord[] = [];
		const recordReg = /(?:\n|^)- (\d\d:\d\d) (.+?): ?(?: \[\[(.+)\]\])?\n\t?((?:.|\n)*?)(?=(?:\n- |$))/g;
		activities = [...records.matchAll(recordReg)].map((item) => {
			const time = item[1] ?? '';
			const category = item[2] ?? '';
			const brief = item[3] ?? '';
			const details: RecordDetail[] = item[4]?.split('\n').map((line) => {
				line = line.trim();
				let match;
				if (line.match(/!\[.*?audio.*?\]\((.*)\)/)) {
					match = line.match(/!\[.*?audio.*?\]\((.*)\)/);
					const content = match ? getRealFilePath(match[1]) : '';
					return { type: 'audio', content };
				}
				if (line.match(/!\[.*\]\((.*)\)/)) {
					match = line.match(/!\[.*\]\((.*)\)/);
					const content = match ? getRealFilePath(match[1]) : '';
					return { type: 'image', content };
				}
				if (line.match(/(?<=<iframe src=').*?(?=')/)) {
					match = line.match(/(?<=<iframe src=').*?(?=')/);
					return { type: 'iframe', content: match ? match[0] : '' };
				}
				const content = line
					.replace(/\[\[(.*)\]\]/g, function (...args) {
						const fileName = args[1];
						return `<a href="obsidian://advanced-uri?vault=${vaultName}&filename=${encodeURI(fileName)}&openmode=true" style="text-decoration-line: none;>${fileName}</a>`;
					})
					.replace(/(?<!!)\[(.*)\]\((.*)\)/g, function (...args) {
						const title = args[1];
						const url = args[2];
						return `<a href="obsidian://web-open?url=${encodeURIComponent(
							url,
						)}" style="text-decoration-line: none;">${title}</a>`;
					})
					.replace(/https?:.*?(?=\s|$)/g, (r) => {
						return `<a href="obsidian://web-open?url=${encodeURIComponent(r)}">${r}</a>`;
					});
				return { type: 'text', content };
			});
			return { time, category, brief, details };
		});
		return activities;
	}
}
