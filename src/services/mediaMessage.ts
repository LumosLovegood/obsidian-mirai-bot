import { Bot, Message } from 'mirai-js';
import type { TFile } from 'obsidian';
import { imgHandler, saveVoice } from 'src/utils';
import type MiraiBot from '../main';
import { ideaService } from './textMessage';

export const picService = async (
	data: any,
	bot: Bot,
	plugin: MiraiBot,
	file: TFile,
	isRercord: boolean,
	messageChain?: any,
) => {
	let message;
	let messageId: number;
	if (!messageChain) {
		message = data.messageChain[1];
		messageId = data.messageChain[0].id;
	} else {
		message = messageChain[1];
		messageId = messageChain[0].id;
	}
	const vault = app.vault;
	const imageUrl = await imgHandler(message.url, plugin.settings);
	let record = `\n\t![${imageUrl}|300](${imageUrl})`;
	if (isRercord) {
		record = `\n- ${window.moment().format('HH:mm')} 🎴记录图片:` + record;
	}
	vault
		.append(file as TFile, record)
		.then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				quote: messageId,
				message: new Message().addText('图片记录下来了~'),
			});
		})
		.catch(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				quote: messageId,
				message: new Message().addText('图片无法记录'),
			});
		});
	if (isRercord) {
		await ideaService(data, bot, plugin, file);
	}
};

export const locationService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile, appInfo: any) => {
	const meta = appInfo['meta']['Location.Search'];
	const { address, name, lat, lng } = meta;
	const note = `\n- ${window.moment().format('HH:mm')} 🚩位置记录: [${address},${name}](geo:${lat},${lng})`;
	app.vault
		.append(file as TFile, note)
		.then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('🚩位置记录下来了~'),
			});
		})
		.catch(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('位置无法记录'),
			});
		});
	await ideaService(data, bot, plugin, file);
};

export const voiceService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
	const url = data.messageChain[1].url;
	const voicePath = await saveVoice(url, plugin.settings);
	const record = `\n- ${window.moment().format('HH:mm')} 💬记录语音:\n\t![audio](${voicePath})`;
	await app.vault.append(file as TFile, record);
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText('语音已记录~'),
	});
	await ideaService(data, bot, plugin, file);
};
