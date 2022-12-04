import { getWod } from 'src/scripts/wod';
import { sendImage, sendText, sendVoice } from 'src/utils';
import { createNoteFromRecord } from './shareService';

export const wodService = async () => {
	const plugin = app.plugins.plugins['obsidian-mirai-bot'];
	await sendText('每日一词获取中~');
	const wodData = await getWod(plugin.settings);
	await createNoteFromRecord({ ...wodData, source: '🔤每日单词' }, 'templateWodPath');
	const { voicePath, cover, definition, didYouKnow } = wodData;
	await sendImage(cover);
	await sendText(definition ?? '');
	await sendText(didYouKnow ?? '');
	console.log('voicePath', voicePath);
	await sendVoice(voicePath?.replace(/\\/g, '/') ?? '');
};
