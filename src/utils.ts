import { exec } from 'child_process';
import { TFile, request, requestUrl } from 'obsidian';
import got from 'got';
import { fromBuffer } from 'file-type';
import type { ActivityRecord, MiraiBotSettings, RecordDetail } from './type';
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
	const { title, link, cover, media, desc } = data;
	const newFileName = title.replace(/[\\/:*?"<>|]/g, '_');

	const file = await getDailyNote(plugin.settings);
	let record = `\n- ${window.moment().format('HH:mm')} ${source}: [[${newFileName}]]`;
	if (cover && cover != '') record += `\n\t![${cover}|300](${cover})`;
	if (media && media != '') record += `\n\t![audio](${media})`;
	if (desc && media != '') record += `\n\t${desc}`;
	await app.vault.append(file as TFile, record + `\n\tFrom ${link}`);

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

export async function getActivities(settings: MiraiBotSettings) {
	const vaultName = encodeURI(app.vault.getName());
	const file = await getDailyNote(settings);
	const records = (await app.vault.read(file as TFile)).replace(
		new RegExp(`.*${settings.timelineIdentifier}`, 's'),
		'',
	);
	let activities: ActivityRecord[] = [];
	const recordReg =
		/(?:\n|^)- (\d\d:\d\d) (.+?): ?(?: \[{1,2}(.+?)\]{1,2}(?:\((.+?)\))?)?\n\t?((?:.|\n)*?)(?=(?:\n- |$))/g;
	activities = [...records.matchAll(recordReg)].map((item) => {
		const time = item[1] ?? '';
		const category = item[2] ?? '';
		const brief = item[3] ?? '';
		const briefLink = item[4]
			? `obsidian://web-open?url=${encodeURIComponent(item[4])}`
			: `obsidian://advanced-uri?vault=${vaultName}&filename=${encodeURI(brief)}&openmode=true`;
		let details: RecordDetail[] = item[5]?.split('\n').map((line) => {
			line = line.trim();
			let match;
			if (line.match(/!\[.*?audio.*?\]\((.*)\)/)) {
				match = line.match(/!\[.*?audio.*?\]\((.*)\)/);
				const content = match ? getRealFilePath(match[1]) : '';
				return { type: 'audio', content };
			}
			if (line.match(/!\[.*\]\((.*)\)/)) {
				match = line.match(/!\[.*\]\((.*)\)/);
				const content = match ? getRealFilePath(match[1]) : '';
				return { type: 'image', content };
			}
			if (line.match(/(?<=<iframe src=').*?(?=')/)) {
				match = line.match(/(?<=<iframe src=').*?(?=')/);
				return { type: 'iframe', content: match ? match[0] : '' };
			}
			const content = line
				.replace(/\[\[(.*)\]\]/g, function (...args) {
					const fileName = args[1];
					return `<a href="obsidian://advanced-uri?vault=${vaultName}&filename=${encodeURI(fileName)}&openmode=true" style="text-decoration-line: none;>${fileName}</a>`;
				})
				.replace(/(?<!!)\[(.*)\]\((.*)\)/g, function (...args) {
					const title = args[1];
					const url = args[2];
					return `<a href="obsidian://web-open?url=${encodeURIComponent(
						url,
					)}" style="text-decoration-line: none;">${title}</a>`;
				})
				.replace(/https?:.*?(?=\s|$)/g, (r) => {
					return `<a href="obsidian://web-open?url=${encodeURIComponent(r)}">${r}</a>`;
				});
			return { type: 'text', content };
		});
		details.forEach((value, index, array) => {
			if (index > 0 && value.type === 'text' && array[index - 1].type === 'text') {
				value.content = array[index - 1].content + '<br/>' + value.content;
				array[index - 1].content = '';
			}
		});
		details = details.filter((d) => d.content != '');
		return { time, category, brief, details, briefLink };
	});
	return activities;
}
