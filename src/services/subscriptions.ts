import type MiraiBot from 'src/main';
import { getWod } from 'src/scripts/wod';
import { createNoteFromRecord, sendImage, sendText, sendVoice } from 'src/utils';

export const wodService = async (plugin: MiraiBot) => {
	await sendText('每日一词获取中~');
	const wodData = await getWod(plugin.settings);
	await createNoteFromRecord(wodData, '🔤每日单词', plugin, plugin.settings.templates['templateWodPath']);
	const { voicePath, cover, description } = wodData;
	await sendImage(cover);
	await sendText(description ?? '');
	console.log('voicePath', voicePath);
	await sendVoice(voicePath?.replace(/\\/g, '/') ?? '');
};
