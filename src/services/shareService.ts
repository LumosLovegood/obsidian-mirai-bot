import type { TFile } from 'obsidian';
import { getAtomRead } from 'src/scripts/atomRead';
import { getBiliInfo } from 'src/scripts/bilibili';
import { getWxoa } from 'src/scripts/wxoa';
import { getZhihu } from 'src/scripts/zhihu';
import type { RecordDetail } from 'src/type';
import { saveRecord, sendImage, sendText } from 'src/utils';
import { textService } from './textSeivice';

export const bilibiliService = async (url: string) => {
	const infoData = await getBiliInfo(url);
	const { cover, author } = infoData;
	if (!cover) return await textService(url);
	await createNoteFromRecord({ ...infoData, source: '📺B站视频' }, 'templateBiliPath');
	await sendText(`📺“${author}”的B站视频已记录√`);
	await sendImage(cover);
};

export const zhihuService = async (url: string) => {
	const infoData = await getZhihu(url);
	const { author, cover } = infoData;
	if (!author) return await textService(url);
	await createNoteFromRecord({ ...infoData, source: '🔎知乎问答' });
	await sendText(`“${author}”的知乎回答已记录~`);
	if (cover && cover != '') await sendImage(cover);
};

export const wxoaService = async (url: string) => {
	const infoData = await getWxoa(url);
	const { author, cover } = infoData;
	if (!author) return await textService(url);
	await createNoteFromRecord({ ...infoData, source: '📄微信文章' });
	await sendText(`“${author}”的微信文章已记录~`);
	await sendImage(cover);
};

export const atomReadService = async (text: string) => {
	const url = text.replace(/.*\n(?=http)/g, '');
	const infoData = await getAtomRead(url);
	const { author, cover } = infoData;
	if (!author) return;
	await createNoteFromRecord({ ...infoData, source: '📄原子阅读' });
	await sendText(`“${author}”的原子阅读文章已记录~`);
	if (cover && cover != '') await sendImage(cover);
};

export const gushiwenService = async (text: string) => {
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

	await createNoteFromRecord({ title, author, dynasty, content, date, source: '📜古诗文' }, 'templatePoemPath');
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

export const createNoteFromRecord = async (info: any, templateName?: string) => {
	const plugin = app.plugins.plugins['obsidian-mirai-bot'];
	const { title, link, cover, media, desc, content, source } = info;
	const newFileName = title.replace(/[\\/:*?"<>|]/g, '_');
	const category = source;
	const brief = newFileName;
	const briefLink = `obsidian://advanced-uri?vault=${app.vault.getName()}&filename=${encodeURI(brief)}&openmode=true`;
	const details: RecordDetail[] = [];

	const headMatch = content?.replace(/\n/g, ' ').match(/^[^![\]()]{15}/gm);
	if (cover && cover != '') details.push({ type: 'image', content: cover });
	if (media && media != '') details.push({ type: 'audio', content: title });
	if (desc && desc != '') details.push({ type: 'text', content: desc });
	if (link && link != '')
		details.push({
			type: 'text',
			content: `From [${headMatch ? headMatch[0] + '...' : newFileName}](${link})`,
		});
	await saveRecord({ category, brief, briefLink, details });

	const newFilePath = plugin.settings.tempFolder + '/' + newFileName + '.md';
	let newFile = app.vault.getAbstractFileByPath(newFilePath);
	if (newFile) return newFile as TFile;

	const templatePath = plugin.settings.templates[templateName ?? 'templateNotePath'] + '.md';
	const templateFile = app.vault.getAbstractFileByPath(templatePath);
	let template = await app.vault.read(templateFile as TFile);
	const VARIABLE_REGEX = new RegExp(/{{VALUE:([^\n\r}]*)}}/);
	// eslint-disable-next-line no-loops/no-loops
	while (RegExp(VARIABLE_REGEX).test(template)) {
		const valueMatch = template.match(VARIABLE_REGEX);
		template = template.replace(VARIABLE_REGEX, () => {
			return valueMatch ? info[valueMatch[1]] : '';
		});
	}
	newFile = await app.vault.create(newFilePath, template);
	return newFile as TFile;
};
