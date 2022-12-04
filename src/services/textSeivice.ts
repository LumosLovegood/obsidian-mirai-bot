import type { RecordDetail } from 'src/type';
import { saveRecord, sendText } from 'src/utils';

export const textService = async (text: string) => {
	const category = '🔍小记';
	const details: RecordDetail[] = [{ type: 'text', content: text }];
	const brief = '';
	const briefLink = '';
	await saveRecord({ category, brief, briefLink, details });
	await sendText('已记录~');
};
