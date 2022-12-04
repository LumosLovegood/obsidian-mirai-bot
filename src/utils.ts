import { exec } from 'child_process';
import type { Readable } from 'stream';
import { Notice, request } from 'obsidian';
import got from 'got';
import { fromBuffer } from 'file-type';
import { createDailyNote, getAllDailyNotes, getDailyNote } from 'obsidian-daily-notes-interface';
import { Message } from 'mirai-js';
import type { ActivityRecord, MiraiBotSettings } from './type';

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
	return getRealFilePath(filePath);
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
	return getRealFilePath(imageFolder + '/' + fileName + '.mp3');
}

export async function createBotFolder() {
	const botFolder = app.vault.configDir + '/mirai-bot';
	const botTempFolder = botFolder + '/temp';
	if (!(await app.vault.adapter.exists(botFolder))) await app.vault.createFolder(botFolder);
	if (!(await app.vault.adapter.exists(botTempFolder))) await app.vault.createFolder(botTempFolder);
}

export async function saveRecord(
	rec: Pick<ActivityRecord, 'brief' | 'briefLink' | 'category' | 'details'>,
	merge?: boolean,
) {
	const now = window.moment();
	const botFolder = app.vault.configDir + '/mirai-bot/';
	const dataPath = botFolder + `data/${now.format('YYYY-MM-DD')}.json`;
	let activities: ActivityRecord[] = [];
	if (await app.vault.adapter.exists(dataPath)) {
		activities = JSON.parse(await app.vault.adapter.read(dataPath));
	}
	const lastRecord = activities[activities.length - 1];
	const lastMtime = lastRecord.mtime ?? lastRecord.time;
	const diff = now.diff(window.moment(lastMtime, 'HH:mm'), 'minutes');
	if (merge && diff < 3) {
		const details = [...lastRecord.details, ...rec.details];
		details.forEach((value, index, array) => {
			if (index > 0 && value.type === 'text' && array[index - 1].type === 'text') {
				value.content = array[index - 1].content + '<br/>' + value.content;
				array[index - 1].content = '';
			}
		});
		activities[activities.length - 1].details = details.filter((d) => d.content != '');
		activities[activities.length - 1].mtime = now.format('HH:mm');
	} else activities.push({ ...rec, time: now.format('HH:mm'), mtime: now.format('HH:mm') });
	await app.vault.adapter.write(dataPath, JSON.stringify(activities));
}

export async function sendText(text: string, quote?: number) {
	const friend = app.plugins.plugins['obsidian-mirai-bot'].settings.myQQ;
	const bot = app.plugins.plugins['obsidian-mirai-bot'].botManager.bot;
	await bot.sendMessage({
		friend: friend,
		message: new Message().addText(text),
		quote,
	});
}

export async function sendImage(url: string, quote?: number) {
	const message = new Message().addImageUrl(url);
	const friend = app.plugins.plugins['obsidian-mirai-bot'].settings.myQQ;
	const bot = app.plugins.plugins['obsidian-mirai-bot'].botManager.bot;
	await bot.sendMessage({
		friend: friend,
		quote,
		message: message,
	});
}

export async function sendVoice(path: string, quote?: number) {
	const friend = app.plugins.plugins['obsidian-mirai-bot'].settings.myQQ;
	const bot = app.plugins.plugins['obsidian-mirai-bot'].botManager.bot;
	await bot.sendMessage({
		friend: friend,
		quote,
		message: new Message().addVoicePath(path),
	});
}

export async function sendMessage(message: any, quote?: number) {
	const friend = app.plugins.plugins['obsidian-mirai-bot'].settings.myQQ;
	const bot = app.plugins.plugins['obsidian-mirai-bot'].botManager.bot;
	await bot.sendMessage({
		friend: friend,
		message: message,
		quote,
	});
}

export function feedback(message: string, to: 'bot' | 'obsidian') {
	if (to === 'bot') {
		return sendText(message);
	}
	new Notice(message);
	console.log(message);
}
