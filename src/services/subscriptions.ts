import { type Bot, Message } from 'mirai-js';
import type { TFile } from 'obsidian';
import type MiraiBot from 'src/main';
import { getWod } from 'src/scripts/wod';
import { createNoteFromRecord } from 'src/utils';

export const wodService = async (bot: Bot, plugin: MiraiBot, file: TFile) => {
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText('每日一词获取中~'),
	});
	const wodData = await getWod(plugin.settings);
	await createNoteFromRecord(wodData, '🔤每日单词', plugin, file, plugin.settings.templates['templateWodPath']);
	const { voicePath, cover, description } = wodData;
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addImageUrl(cover ?? '').addText(description ?? ''),
	});
	console.log('voicePath', voicePath);
	bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addVoicePath(voicePath?.replace(/\\/g, '/') ?? ''),
	});
};
