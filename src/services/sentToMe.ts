import { Message } from 'mirai-js';
import type { BotManager } from 'src/botManager';

export const sendToMe = async (content: string, botManager: BotManager) => {
	const imgReg = /!\[.*?\]\((.*?)\)/gm;
	console.log(content);
	content = content.replace(imgReg, (...args) => {
		botManager.sendMessage(new Message().addImageUrl(args[1]));
		return '';
	});
	content = content
		.replace(/\[\[(.*?)\]\]/, (...args) => {
			return args[1];
		})
		.trim();
	if (content != '') botManager.sendMessage(new Message().addText(content));
};
