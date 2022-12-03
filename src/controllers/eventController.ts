import { addVaultEventRecord } from 'src/services/addRecordEvent';
import type MiraiBot from '../main';

export class EventController {
	constructor(private readonly plugin: MiraiBot) {
		app.workspace.onLayoutReady(() => this.init());
	}
	init() {
		this.plugin.registerEvent(
			app.vault.on('create', (file) => {
				addVaultEventRecord(this.plugin, file);
			}),
		);
		this.plugin.registerEvent(
			app.vault.on('rename', (file) => {
				addVaultEventRecord(this.plugin, file);
			}),
		);
	}
}
