import { ItemView, WorkspaceLeaf } from 'obsidian';
import type MiraiBot from 'src/main';
import { sendToMe } from '../services/messageServices';
import type Component from './components/BotActivityView.svelte';
export const VIEW_TYPE_BOT_PANEL = 'bot-panel';

export class BotPanel extends ItemView {
	component: Component;

	constructor(leaf: WorkspaceLeaf, readonly plugin: MiraiBot) {
		super(leaf);
		this.navigation = false;
	}

	getViewType() {
		return VIEW_TYPE_BOT_PANEL;
	}
	getIcon(): string {
		return 'bot';
	}
	getDisplayText() {
		return 'Bot Panel';
	}

	async onOpen() {
		const plugin = this.plugin;
		const contentEl = this.contentEl;
		contentEl.contentEditable = 'true';
		if (contentEl.getText() === '') contentEl.setText('可以把要传输的内容拖过来~');
		contentEl.addEventListener('drop', function (event) {
			const message = event.dataTransfer?.getData('text/plain') ?? '';
			contentEl.setText(message);
			const htmlStr = event.dataTransfer?.getData('text/html') ?? '';
			const html = new DOMParser().parseFromString(htmlStr, 'text/html').body;
			const src = html.querySelector('img')?.src;
			console.log(html.firstChild);
			if (src) {
				contentEl.createEl('img', { attr: { src: src } });
				sendToMe(`![ss](${src})`, plugin.botManager);
			} else {
				sendToMe(message, plugin.botManager);
			}
			event.preventDefault();
		});
	}
	async onClose() {}
}
