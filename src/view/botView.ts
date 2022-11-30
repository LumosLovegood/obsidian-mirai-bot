import { ItemView, WorkspaceLeaf } from 'obsidian';
import type MiraiBot from 'src/main';
import store from 'src/store';
import Component from './svelte/BotActivityView.svelte';
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
				settings: this.plugin.settings,
				plugin: this.plugin,
			},
		});
	}

	async onClose() {
		this.component.$destroy();
	}
}
