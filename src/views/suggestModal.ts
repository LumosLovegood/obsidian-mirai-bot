import { FuzzySuggestModal } from 'obsidian';
import { getBookInfo } from 'src/scripts/doubanBook';
import { createNoteFromRecord } from 'src/services/shareService';

export class BookModal extends FuzzySuggestModal<{ text: string; url: string }> {
	constructor(private items: { text: string; url: string }[]) {
		super(app);
		this.open();
	}
	getItems(): { text: string; url: string }[] {
		return this.items;
	}

	getItemText(item: { text: string; url: string }): string {
		return item.text;
	}

	async onChooseItem(item: { text: string; url: string }, evt: MouseEvent | KeyboardEvent) {
		const infoData = await getBookInfo(item.url);
		const file = await createNoteFromRecord({ ...infoData, source: '📖读书' }, 'templateBookPath');
		app.workspace.openLinkText(file.path, '', true);
	}
}
