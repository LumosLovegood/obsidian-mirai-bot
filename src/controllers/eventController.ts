import { addVaultEventRecord } from 'src/services/eventService';
import type MiraiBot from '../main';

export class EventController {
	constructor(private readonly plugin: MiraiBot) {
		app.workspace.onLayoutReady(() => this.init());
	}
	init() {
		this.plugin.registerEvent(
			app.vault.on('create', (file) => {
				if (this.plugin.botManager.creating) return;
				addVaultEventRecord(file);
			}),
		);
	}
}
