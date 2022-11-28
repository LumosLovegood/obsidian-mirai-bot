import { exec } from 'child_process';
import { TFile, request, requestUrl } from 'obsidian';
import got from 'got';
import { fromBuffer } from 'file-type';
import type { MiraiBotSettings } from './type';
import type MiraiBot from './main';

const VARIABLE_REGEX = new RegExp(/{{VALUE:([^\n\r}]*)}}/);

export const getDailyNote = async function ({ note }: MiraiBotSettings) {
	let fileName = note.format;
	if (fileName && fileName.endsWith('.md')) fileName = fileName.replace('.md', '');
	const filePath = note.folder + '/' + window.moment().format(fileName) + '.md';
	if (!app.vault.adapter.exists(filePath)) {
		return await app.vault.create(filePath, '');
	}
	return app.metadataCache.getFirstLinkpathDest(filePath, '');
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

export const createNoteFromRecord = async (data: any, source: string, plugin: MiraiBot, templatePath?: string) => {
	const { title, link, cover } = data;
	const newFileName = title.replace(/[\\/:*?"<>|]/g, '_');

	const file = await getDailyNote(plugin.settings);
	let record = `\n- ${window.moment().format('HH:mm')} ${source}: [[${newFileName}]]`;
	if (cover && cover != '') record = record + `\n\t![${cover}|300](${cover})\n\tFrom ${link}`;
	await app.vault.append(file as TFile, record);

	const newFilePath = plugin.settings.tempFolder + '/' + newFileName + '.md';
	const newFile = app.vault.getAbstractFileByPath(newFilePath);
	if (newFile) return newFile;

	templatePath = templatePath ? templatePath + '.md' : plugin.settings.templates['templateNotePath'] + '.md';
	const templateFile = app.vault.getAbstractFileByPath(templatePath);
	let template = await app.vault.read(templateFile as TFile);
	// eslint-disable-next-line no-loops/no-loops
	while (RegExp(VARIABLE_REGEX).test(template)) {
		const valueMatch = template.match(VARIABLE_REGEX);
		template = template.replace(VARIABLE_REGEX, () => {
			return valueMatch ? data[valueMatch[1]] : '';
		});
	}

	return await app.vault.create(newFilePath, template);
};

export const autoCreateDailyNote = (plugin: MiraiBot) => {
	if (!plugin.settings.autoCreateDailyNote) return;
	return plugin.registerInterval(
		window.setTimeout(
			() => getDailyNote(plugin.settings),
			(window.moment('00:01', 'HH:mm') as unknown as number) +
				1000 * 3600 * 24 -
				(window.moment() as unknown as number),
		),
	);
};

export const getRealFilePath = (path: string) => {
	if (!path.match(/^https?:/)) {
		const f = app.metadataCache.getFirstLinkpathDest(path, '');
		if (f) return app.vault.getResourcePath(f);
	}
	return path;
};

export const imgHandler = async (imageUrl: string | undefined, settings: MiraiBotSettings) => {
	console.log(imageUrl);
	if (!imageUrl) return;
	if (!settings.enableImageUpload) return await saveImage(imageUrl, settings);
	return await uploadImageByPicgo(imageUrl);
};
export const uploadImageByPicgo = async (imageUrl: string) => {
	const res = await requestUrl({
		url: 'http://127.0.0.1:36677/upload',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ list: [imageUrl] }),
	});
	const data = res.json;
	if (res.status !== 200) {
		return;
	}
	return data.result;
};
// Code from obsidian-local-image https://github.com/aleksey-rezvov/obsidian-local-images/blob/master/src/utils.ts
export async function downloadBufferItem(url: string): Promise<ArrayBuffer> {
	const res = await got(url, { responseType: 'buffer' });
	return res.body;
}
export async function fileExtByContent(content: ArrayBuffer) {
	return (await fromBuffer(content))?.ext;
}

export async function saveImage(imageUrl: string, { imageFolder }: MiraiBotSettings) {
	if (!(await app.vault.adapter.exists(imageFolder))) {
		await app.vault.createFolder(imageFolder);
	}
	const fileData = await downloadBufferItem(imageUrl);
	const fileExt = await fileExtByContent(fileData);
	const fileName = imageUrl.replace(/https?:\/\//, '').replace(/[\\/:*?"<>|.]/g, '!');
	const filePath = imageFolder + '/' + fileName + '.' + fileExt;
	if (!(await app.vault.adapter.exists(filePath))) {
		await app.vault.createBinary(filePath, fileData);
	}
	return filePath;
}

export async function saveVoice(url: string, { imageFolder }: MiraiBotSettings) {
	if (!(await app.vault.adapter.exists(imageFolder))) {
		await app.vault.createFolder(imageFolder);
	}
	await createBotFolder();
	const fileName = window.moment().format('YYYYMMDDHHmmss');
	//@ts-ignore
	const basePath = app.vault.adapter.basePath;
	const mp3Path = basePath + '/' + imageFolder + '/' + fileName + '.mp3';
	const botFolder = basePath + '/' + app.vault.configDir + '/mirai-bot';
	const pcmPath = botFolder + '/' + fileName + '.pcm';
	const slkPath = botFolder + '/' + fileName + '.slk';
	const pyPath = botFolder + '/slk2mp3.py';
	const cmdStr = `pwsh.exe -c python ${pyPath} ${slkPath} ${pcmPath} ${mp3Path} '${url.replace(/&/g, '^&')}'`;
	exec(cmdStr);
	return imageFolder + '/' + fileName + '.mp3';
}

export async function createBotFolder() {
	const botFolder = app.vault.configDir + '/mirai-bot';
	if (!(await app.vault.adapter.exists(botFolder))) await app.vault.createFolder(botFolder);
}
