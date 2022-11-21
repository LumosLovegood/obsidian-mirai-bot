import { TFile, request, requestUrl } from 'obsidian';
import type { MiraiBotSettings } from '../gui/miraiBotSettingTab';
import type MiraiBot from '../main';

const VARIABLE_REGEX = new RegExp(/{{VALUE:([^\n\r}]*)}}/);

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

export const uploadImageByPicgo = async (imageUrl: string | undefined) => {
	if (!imageUrl) return;
	const res = await requestUrl({
		url: 'http://127.0.0.1:36677/upload',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ list: [imageUrl] }),
	});
	const data = res.json;
	if (res.status !== 200) {
		return;
	} else {
		return data.result;
	}
};

export const getParsedHtml = async (url: string, headers: any) => {
	const searchUrl = new URL(url);
	const res = await request({
		url: searchUrl.href,
		method: 'GET',
		headers: headers,
	});
	if (!res) {
		return;
	}
	return new DOMParser().parseFromString(res, 'text/html');
};

export const createNote = async (data: any, source: string, plugin: MiraiBot) => {
	const templateFile = app.vault.getAbstractFileByPath(plugin.settings.templateNotePath + '.md');
	if (!templateFile) return;
	const { title, link, cover } = data;
	let template = await app.vault.read(templateFile as TFile);
	let count = 0;
	// eslint-disable-next-line no-loops/no-loops
	while (RegExp(VARIABLE_REGEX).test(template)) {
		const valueMatch = template.match(VARIABLE_REGEX);
		template = template.replace(VARIABLE_REGEX, () => {
			return valueMatch ? data[valueMatch[1]] : '';
		});
		console.log(count++);
	}
	const newFileName = title.replace(/[\\/:*?"<>|]/g, '_');
	const newFilePath = plugin.settings.tempFolder + '/' + newFileName + '.md';
	await app.vault.create(newFilePath, template);

	const { file } = await getNoteFile(plugin.settings);
	let record = `\n- ${window.moment().format('HH:mm')} ${source}: [[${newFileName}]]`;
	if (cover && cover != '') record = record + `\n![${link}|300](${cover})`;

	await app.vault.append(file as TFile, record);

	return newFilePath;
};
