import { MiraiBotSettings } from '../gui/miraiBotSettingTab';

export const getNoteFile = function ({ note }: MiraiBotSettings) {
	let fileName = note.format;
	if (fileName && fileName.endsWith('.md')) fileName = fileName.replace('.md', '');
	const filePath = note.folder + '/' + window.moment().format(fileName) + '.md';
	const file = app.vault.getAbstractFileByPath(filePath);
	return { file, filePath };
};
