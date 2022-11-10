import { Bot, Message } from 'mirai-js';
import { TFile } from 'obsidian';
import { getBiliInfo } from 'src/scripts/bilibili';
import { getNoteFile, uploadUrlImage } from 'src/utils';
import MiraiBot from '../main';

export const noteService = async (data: any, bot: Bot, plugin: MiraiBot) => {
	const {
		waitFor,
		sender: { id },
	} = data;
	const vault = app.vault;
	await bot.sendMessage({ friend: id, message: new Message().addText('有在认真听~') });
	const message = new Message();
	const nowTitle = '\n##### ' + window.moment().format('M月D日 HH:mm') + '\n';

	const { file } = await getNoteFile(plugin.settings);

	vault.append(file as TFile, nowTitle);
	message.addText('记录完成√\n---------\n');
	let note = (await waitFor.messageChain())[1];
	let isFirst = true;
	// eslint-disable-next-line no-loops/no-loops
	while (!['写完了', '记录完毕', '结束'].includes(note.text ?? '')) {
		if (note.type === 'Plain') {
			let plain = note.text ?? '';
			if (!isFirst && plain != '。') plain = '，' + plain;
			else isFirst = false;
			if (plain?.endsWith('。')) {
				plain = plain.replace(/。$/g, '\n');
				isFirst = true;
			}
			vault.append(file as TFile, plain);
			message.addText(plain);
		} else {
			vault.append(file as TFile, `\n![](${(await uploadUrlImage(note.url)) ?? note.url})`);
			message.addImageUrl(note.url ?? '');
		}
		note = (await waitFor.messageChain())[1];
	}
	await bot.sendMessage({ friend: id, message: message });
};

export const picService = async (data: any, bot: Bot, plugin: MiraiBot) => {
	const message = data.messageChain[1];
	const vault = app.vault;
	const { file, filePath } = await getNoteFile(plugin.settings);
	const bannerUrl = (await uploadUrlImage(message.url)) ?? message.url;
	vault.append(file as TFile, `\n![banner](${bannerUrl})`).then(() => {
		bot.sendMessage({
			friend: data.sender.id,
			message: new Message().addText('图片记录下来了，如果想设置封面的话，回复 封面 就可以了~'),
		});
	});
	const addCover = await data.waitFor.friend(data.sender.id).text();
	console.log('🚀 ~ addCover', addCover);
	if (addCover === '封面') {
		// @ts-ignore
		const { update, getPropertiesInFile } = app.plugins.plugins['metaedit'].api;
		const properties: string[] = (await getPropertiesInFile(filePath))?.map((p: { key: string }) => p.key);
		if (!properties.includes('banner'))
			return bot.sendMessage({
				friend: data.sender.id,
				message: new Message().addText('没办法更换封面QAQ'),
			});

		update('banner', `"${bannerUrl}"`, filePath).then(() => {
			bot.sendMessage({
				friend: data.sender.id,
				message: new Message().addText('封面更换好了~'),
			});
		});
	}
};

export const bilibiliService = async (data: any, bot: Bot, plugin: MiraiBot, bUrl: string) => {
	const sender = data.sender;
	await bot.sendMessage({
		friend: sender.id,
		message: new Message().addImageUrl(await getBiliInfo(bUrl)),
	});
};
