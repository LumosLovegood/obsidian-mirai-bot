import type { TFile } from 'obsidian';
import type { Parameters } from '../type';
import { getDailyNoteFile } from '../utils';
import type { MiraiBotSettings } from '../type';

export const protocolHandler = async (parameters: Parameters, settings: MiraiBotSettings) => {
	// eslint-disable-next-line no-loops/no-loops
	for (const parameter in parameters) {
		(parameters as any)[parameter] = decodeURIComponent((parameters as any)[parameter]);
	}
	const { type, source, title, content } = parameters;
	console.log(parameters);
	let record;
	if (type === 'plain') {
		record = handlePlain(source, content, title);
	}
	if (type === 'image') {
		record = await handleImage(source, content, title, settings);
	}
	const file = await getDailyNoteFile();
	if (!record) return;
	app.vault.append(file as TFile, record);
};

export const handlePlain = (source: string, content: string, title: string) => {
	const titleSplit = title.split(' - ');
	const from = titleSplit[titleSplit.length - 1];
	content = content.replace(/(?<=[^!.,?\-;:()"[{}，。！？”])\n/gm, '').replace(/\n/g, '\t\n');
	let desc = '';
	if (titleSplit.length != 1) {
		desc = `[${titleSplit[0]}](${source})`;
	}
	return `\n- ${window.moment().format('HH:mm')} ${from}: ${desc}\n\t${content.trim()}`;
};

export const handleImage = async (source: string, content: string, title: string, settings: MiraiBotSettings) => {
	if (!content.match(/http\s*/g)) return;
	content = content.replace(/@.*$/, '');
	// const filePath = await imgHandler(content, settings);
	const filePath = content;
	return `\n- ${window
		.moment()
		.format('HH:mm')} 🎴记录图片:\n![${filePath}|300](${filePath})\n\tFrom [${title}](${source})`;
};
