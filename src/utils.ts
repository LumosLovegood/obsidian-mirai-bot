import { requestUrl } from 'obsidian';
import { MiraiBotSettings } from './gui/miraiBotSettingTab';

export const getNoteFile = async function ({ note }: MiraiBotSettings) {
	let fileName = note.format;
	if (fileName && fileName.endsWith('.md')) fileName = fileName.replace('.md', '');
	let filePath = note.folder + '/' + window.moment().format(fileName) + '.md';
	let file = app.vault.getAbstractFileByPath(filePath);
	let isTargetFile = true;
	if (!file) {
		file = app.vault.getAbstractFileByPath('Inbox.md');
		if (!file) file = await app.vault.create('Inbox.md', '\n');
		filePath = 'Inbox.md';
		isTargetFile = false;
	}
	return { file, filePath, isTargetFile };
};

export const uploadUrlImage = async (imageUrl: string | undefined) => {
	if (!imageUrl) return;
	const res = await requestUrl({
		url: 'http://127.0.0.1:36677/upload',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ list: [imageUrl] }),
	});
	const data = res.json;
	console.log(data);
	if (res.status !== 200) {
		return;
	} else {
		return data.result;
	}
};
