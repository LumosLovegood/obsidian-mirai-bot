import { saveRecord } from 'src/utils';
import type { Parameters, RecordDetail } from '../type';

export const protocolHandler = async (parameters: Parameters) => {
	// eslint-disable-next-line no-loops/no-loops
	for (const parameter in parameters) {
		(parameters as any)[parameter] = decodeURIComponent((parameters as any)[parameter]);
	}
	const { type, source, title, content } = parameters;
	console.log(parameters);
	if (type === 'plain') {
		await handlePlain(source, content, title);
	}
	if (type === 'image') {
		await handleImage(source, content, title);
	}
};

export const handlePlain = async (source: string, content: string, title: string) => {
	const titleSplit = title.split(' - ');
	const category = titleSplit[titleSplit.length - 1];
	content = content
		.replace(/(?<=[^!.,?\-;:()"[{}，。！？”])\n/gm, '')
		.replace(/\n/g, '\t\n')
		.trim();
	let brief = '';
	let briefLink = '';
	if (titleSplit.length != 1) {
		brief = titleSplit[0];
		briefLink = source;
	}
	const details: RecordDetail[] = [{ type: 'text', content }];
	await saveRecord({ category, brief, details, briefLink }, false);
};

export const handleImage = async (source: string, content: string, title: string) => {
	if (!content.match(/http\s*/g)) return;
	content = content.replace(/@.*$/, '');
	const filePath = content;
	const category = '🎴记录图片';
	const details: RecordDetail[] = [{ type: 'image', content: filePath }];
	const brief = title;
	const briefLink = source;
	await saveRecord({ category, brief, details, briefLink }, false);
};
