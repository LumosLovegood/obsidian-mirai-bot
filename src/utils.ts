import { exec } from 'child_process';
import type { Readable } from 'stream';
import { TFile, request } from 'obsidian';
import got from 'got';
import { fromBuffer } from 'file-type';
import { createDailyNote, getAllDailyNotes, getDailyNote } from 'obsidian-daily-notes-interface';
import type { MiraiBotSettings } from './type';
import type MiraiBot from './main';

const VARIABLE_REGEX = new RegExp(/{{VALUE:([^\n\r}]*)}}/);

export const getDailyNoteFile = async function (date: moment.Moment = window.moment()) {
	const dailyNotes = getAllDailyNotes();
	if (!getDailyNote(date, dailyNotes)) {
		return createDailyNote(date);
	}
	return getDailyNote(date, dailyNotes);
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

export const createNoteFromRecord = async (
	data: any,
	source: string,
	plugin: MiraiBot,
	file: TFile,
	templatePath?: string,
) => {
	plugin.botManager.creating = true;
	const { title, link, cover, media, desc, content } = data;
	const newFileName = title.replace(/[\\/:*?"<>|]/g, '_');

	let record = `\n- ${window.moment().format('HH:mm')} ${source}: [[${newFileName}]]`;
	if (cover && cover != '') record += `\n\t![${cover}|300](${cover})`;
	if (media && media != '') record += `\n\t![audio](${media})`;
	if (desc && desc != '') record += `\n\t${desc}`;
	if (content && content != '') record += `\n\t${content.slice(0, 10) + '...'}`;
	if (link && link != '') record += `\n\tFrom ${link}`;
	await app.vault.append(file as TFile, record);

	const newFilePath = plugin.settings.tempFolder + '/' + newFileName + '.md';
	let newFile = app.vault.getAbstractFileByPath(newFilePath);
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
	newFile = await app.vault.create(newFilePath, template);
	plugin.botManager.creating = false;
	return newFile;
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
	return (await uploadImageByPicgo(imageUrl)) ?? (await saveImage(imageUrl, settings));
};

export async function streamToString(stream: Readable | null) {
	if (!stream) return '';
	const chunks = [];
	// eslint-disable-next-line no-loops/no-loops
	for await (const chunk of stream) {
		chunks.push(Buffer.from(chunk));
	}
	return Buffer.concat(chunks).toString('utf-8');
}

export const uploadImageByPicgo = async (imageUrl: string) => {
	// const res = await requestUrl({
	// 	url: 'http://127.0.0.1:36677/upload',
	// 	method: 'POST',
	// 	headers: { 'Content-Type': 'application/json' },
	// 	body: JSON.stringify({ list: [imageUrl] }),
	// }).catch(() => {
	// 	return;
	// });
	// const data = res?.json;
	// if (res?.status !== 200) {
	// 	return;
	// }
	// return data.result;
	const cmdStr = `picgo u ${imageUrl.replace(/&/g, '^&')}`;
	const { stdout } = await exec(cmdStr);
	const message = await streamToString(stdout);
	const dataList = message.split('\n').filter((d) => d != '');
	return dataList[dataList.length - 1];
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
	const botTempFolder = botFolder + '/temp';
	const pcmPath = botTempFolder + '/' + fileName + '.pcm';
	const slkPath = botTempFolder + '/' + fileName + '.slk';
	const pyPath = botFolder + '/slk2mp3.py';
	const cmdStr = `pwsh.exe -c python ${pyPath} ${slkPath} ${pcmPath} ${mp3Path} '${url.replace(/&/g, '^&')}'`;
	exec(cmdStr);
	return imageFolder + '/' + fileName + '.mp3';
}

export async function createBotFolder() {
	const botFolder = app.vault.configDir + '/mirai-bot';
	const botTempFolder = botFolder + '/temp';
	if (!(await app.vault.adapter.exists(botFolder))) await app.vault.createFolder(botFolder);
	if (!(await app.vault.adapter.exists(botTempFolder))) await app.vault.createFolder(botTempFolder);
}
