import type { RecordDetail } from 'src/type';
import { imgHandler, saveRecord, saveVoice, sendText } from 'src/utils';
import type MiraiBot from '../main';

export const picService = async (plugin: MiraiBot, isRercord: boolean, messageChain: any) => {
	const message = messageChain[1];
	const messageId = messageChain[0].id;
	const imageUrl = await imgHandler(message.url, plugin.settings);
	let feedback = '图片记录下来了~';
	if (!imageUrl) {
		feedback = '图片无法记录';
	}
	await sendText(feedback, messageId);
	const detail: RecordDetail = { type: 'image', content: imageUrl ?? '' };
	if (isRercord) {
		const category = '🎴记录图片';
		const details = [detail];
		await saveRecord({
			category,
			details,
			brief: '',
			briefLink: '',
		});
	}
	return detail;
};

export const locationService = async (appInfo: any) => {
	const meta = appInfo['meta']['Location.Search'];
	const { address, name, lat, lng } = meta;
	const category = '🚩位置记录';
	const brief = name;
	const briefLink = `geo:${lat},${lng}`;
	const details: RecordDetail[] = [{ type: 'text', content: `${address},${name},${lat},${lng})` }];
	await saveRecord({ category, brief, briefLink, details });
	await sendText(`位置已记录， ${lat},${lng})`);
};

export const voiceService = async (plugin: MiraiBot, url: string) => {
	const voicePath = await saveVoice(url, plugin.settings);
	const category = '💬记录语音';
	const brief = '';
	const briefLink = '';
	const details: RecordDetail[] = [{ type: 'audio', content: voicePath }];
	await saveRecord({ category, brief, briefLink, details });
	await sendText('语音已记录');
};
