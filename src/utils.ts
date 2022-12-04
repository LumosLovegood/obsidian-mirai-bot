import { exec } from 'child_process';
import type { Readable } from 'stream';
import { request } from 'obsidian';
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

export async function saveRecord(rec: Pick<ActivityRecord, 'brief' | 'briefLink' | 'category' | 'details'>) {
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
	if (diff < 5) {
		activities[activities.length - 1].details = [...lastRecord.details, ...rec.details];
		activities[activities.length - 1].mtime = now.format('HH:mm');
	} else activities.push({ ...rec, time: now.format('HH:mm'), mtime: now.format('HH:mm') });
	await app.vault.adapter.write(dataPath, JSON.stringify(activities));
}

export async function sendText(text: string, quote?: number) {
	//@ts-ignore
	await window.miraiBot.sendMessage({
		//@ts-ignore
		friend: window.senderID,
		message: new Message().addText(text),
		quote,
	});
}

export async function sendImage(url: string, quote?: number) {
	const message = new Message().addImageUrl(url);
	//@ts-ignore
	await window.miraiBot.sendMessage({
		//@ts-ignore
		friend: window.senderID,
		quote,
		message: message,
	});
}

export async function sendVoice(path: string, quote?: number) {
	//@ts-ignore
	await window.miraiBot.sendMessage({
		//@ts-ignore
		friend: window.senderID,
		quote,
		message: path,
	});
}

export async function sendMessage(message: any, quote?: number) {
	//@ts-ignore
	await window.miraiBot.sendMessage({
		//@ts-ignore
		friend: window.senderID,
		message: message,
		quote,
	});
}
