import { sendImage, sendText } from 'src/utils';

export const sendToMe = async (content: string) => {
	const imgReg = /!\[.*?\]\((.*?)\)/gm;
	console.log(content);
	content = content.replace(imgReg, (...args) => {
		sendImage(args[1]);
		return '';
	});
	content = content
		.replace(/\[\[(.*?)\]\]/, (...args) => {
			return args[1];
		})
		.trim();
	if (content != '') sendText(content);
};
