import type { TFile } from 'obsidian';
import type MiraiBot from 'src/main';
import { getAtomRead } from 'src/scripts/atomRead';
import { getBiliInfo } from 'src/scripts/bilibili';
import { getWxoa } from 'src/scripts/wxoa';
import { getZhihu } from 'src/scripts/zhihu';
import type { RecordDetail } from 'src/type';
import { saveRecord, sendImage, sendText } from 'src/utils';
import { textService } from './textMessage';

export const bilibiliService = async (plugin: MiraiBot, url: string) => {
	const infoData = await getBiliInfo(url);
	const { cover, author } = infoData;
	if (!cover) return await textService(url);
	await createNoteFromRecord(infoData, '📺B站视频', plugin, plugin.settings.templates['templateBiliPath']);
	await sendText(`📺“${author}”的B站视频已记录√`);
	await sendImage(cover);
};

export const zhihuService = async (plugin: MiraiBot, url: string) => {
	const infoData = await getZhihu(url);
	const { author, cover } = infoData;
	if (!author) return await textService(url);
	await createNoteFromRecord(infoData, '🔎知乎问答', plugin);
	await sendText(`“${author}”的知乎回答已记录~`);
	if (cover && cover != '') await sendImage(cover);
};

export const wxoaService = async (plugin: MiraiBot, url: string) => {
	const infoData = await getWxoa(url);
	const { author, cover } = infoData;
	if (!author) return await textService(url);
	await createNoteFromRecord(infoData, '📄微信文章', plugin);
	await sendText(`“${author}”的微信文章已记录~`);
	await sendImage(cover);
};

export const atomReadService = async (plugin: MiraiBot, text: string) => {
	const url = text.replace(/.*\n(?=http)/g, '');
	const infoData = await getAtomRead(url);
	const { author, cover } = infoData;
	if (!author) return;
	await createNoteFromRecord(infoData, '📄原子阅读', plugin);
	await sendText(`“${author}”的原子阅读文章已记录~`);
	if (cover && cover != '') await sendImage(cover);
};

export const gushiwenService = async (plugin: MiraiBot, text: string) => {
	let info: string = text.replace(/http.*$/g, '');
	const titleMatch = info.match(/(?<=《).{1,15}(?=》$)/g);
	const title = titleMatch ? titleMatch[titleMatch.length - 1] : '';
	info = info.replace(/《.{1,15}》$/g, '');
	const authorMatch = info.match(/(?<=·).{1,10}$/g);
	const author = authorMatch ? authorMatch[0] : '';
	info = info.replace(/·.{1,10}$/g, '');
	const dynastyMatch = info.match(/(?<=— ).{1,5}$/g);
	const dynasty = dynastyMatch ? dynastyMatch[0] : '';
	const content = info.replace(/ — .{1,5}$/g, '');
	const date = window.moment().format('YYYY-MM-DD');

	await createNoteFromRecord(
		{ title, author, dynasty, content, date },
		'📜古诗文',
		plugin,
		plugin.settings.templates['templatePoemPath'],
	);
	await sendText(`“${author}”的${title}已记录~`);
};

export const musicService = async (musicInfo: any) => {
	const { musicUrl, kind, title, jumpUrl } = musicInfo;
	let server: 'tencent' | 'netease';
	const id = musicUrl.match(/(?<=[\W|songm]id=)\w+/g)[0];
	if (kind === 'QQMusic') server = 'tencent';
	else if (kind === 'NeteaseCloudMusic') server = 'netease';
	else {
		await sendText('暂不支持该平台的分享哦~');
		return;
	}
	if (id) {
		const category = '🎵记录音乐';
		const brief = title;
		const briefLink = jumpUrl;
		const details: RecordDetail[] = [
			{
				type: 'iframe',
				content: `https://notion.busiyi.world/music-player/?server=${server}&type=song&id=${id}&dark`,
			},
		];
		await saveRecord({ category, brief, briefLink, details });
		await sendText(`分享的音乐已记录~\n${title}`);
	}
};

export const createNoteFromRecord = async (data: any, source: string, plugin: MiraiBot, templatePath?: string) => {
	const { title, link, cover, media, desc, content } = data;
	const newFileName = title.replace(/[\\/:*?"<>|]/g, '_');
	const category = source;
	const brief = newFileName;
	const briefLink = `obsidian://advanced-uri?vault=${app.vault.getName()}&filename=${encodeURI(brief)}&openmode=true`;
	const details: RecordDetail[] = [];

	const headMatch = content?.replace(/\n/g, ' ').match(/^[^![\]()]{15}/gm);
	if (cover && cover != '') details.push({ type: 'image', content: cover });
	if (media && media != '') details.push({ type: 'audio', content: media });
	if (desc && desc != '') details.push({ type: 'text', content: desc });
	if (link && link != '')
		details.push({
			type: 'text',
			content: `From [${headMatch ? headMatch[0] + '...' : newFileName}](${link})`,
		});
	await saveRecord({ category, brief, briefLink, details });

	const newFilePath = plugin.settings.tempFolder + '/' + newFileName + '.md';
	let newFile = app.vault.getAbstractFileByPath(newFilePath);
	if (newFile) return newFile;

	templatePath = templatePath ? templatePath + '.md' : plugin.settings.templates['templateNotePath'] + '.md';
	const templateFile = app.vault.getAbstractFileByPath(templatePath);
	let template = await app.vault.read(templateFile as TFile);
	const VARIABLE_REGEX = new RegExp(/{{VALUE:([^\n\r}]*)}}/);
	// eslint-disable-next-line no-loops/no-loops
	while (RegExp(VARIABLE_REGEX).test(template)) {
		const valueMatch = template.match(VARIABLE_REGEX);
		template = template.replace(VARIABLE_REGEX, () => {
			return valueMatch ? data[valueMatch[1]] : '';
		});
	}
	newFile = await app.vault.create(newFilePath, template);
	return newFile;
};
