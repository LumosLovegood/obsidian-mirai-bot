import { Bot, Message, Middleware } from 'mirai-js';
import { TFile } from 'obsidian';
import { uploadUrlImage } from 'src/utils/uploadImage';
import MiraiBot from '../main';
import { getBiliInfo } from '../scripts/bilibili';
// import { uploadUrlImage } from '../utils/uploadImage';
import { getNoteFile } from '../utils/getNoteFile';

export const getBilibiliCover = function (bot: Bot, plugin?: MiraiBot) {
	return new Middleware().done(async (data) => {
		const sender = data.sender;
		const message = data.messageChain[1];
		const reg = /https?:\/\/((www|m)\.bilibili\.com\/video\/\S*\?|b23\.tv\/\S*)/gm;

		const target = (message.text ?? message.content?.replace(/\\/gm, ''))?.match(reg);
		if (target) {
			await bot.sendMessage({
				friend: sender.id,
				message: new Message().addImageUrl(await getBiliInfo(target[0])),
			});
		}
	});
};

export const setTodayBanner = function (bot: Bot, plugin: MiraiBot) {
	return new Middleware().done(async (data) => {
		const message = data.messageChain[1];
		if (message.type === 'Image') {
			// @ts-ignore
			const { update, getPropertiesInFile } = app.plugins.plugins['metaedit'].api;
			const vault = app.vault;
			const { file, filePath } = getNoteFile(plugin.settings);
			const properties: string[] = (await getPropertiesInFile(filePath))?.map((p: { key: string }) => p.key);
			if (!file || !properties.includes('banner'))
				return bot.sendMessage({
					friend: data.sender.id,
					message: new Message().addText('没有banner'),
				});

			const bannerUrl = (await uploadUrlImage(message.url)) ?? message.url;
			update('banner', `"${bannerUrl}"`, filePath).then(() => {
				bot.sendMessage({
					friend: data.sender.id,
					message: new Message().addText('封面更换好了~'),
				});
			});
			vault.append(file as TFile, `\n![|banner](${bannerUrl})`);
		}
	});
};

export const note = function (bot: Bot, plugin: MiraiBot) {
	return new Middleware()
		.textProcessor()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async ({ waitFor, text, sender: { id } }) => {
			console.log(text);
			if (['写点东西', '记点东西', '在吗'].includes(text)) {
				const vault = app.vault;
				await bot.sendMessage({ friend: id, message: new Message().addText('有在认真听~') });
				const message = new Message();
				const nowTitle = '\n##### ' + window.moment().format('M月D日 HH:mm') + '\n';

				let { file } = getNoteFile(plugin.settings);

				if (!file) {
					file = vault.getAbstractFileByPath('Inbox.md');
					if (!file) file = await vault.create('Inbox.md', nowTitle);
					if (!file) {
						await bot.sendMessage({
							friend: id,
							message: message.addText('我这里好像记不下了，不过没关系你继续说'),
						});
						return;
					} else {
						await bot.sendMessage({
							friend: id,
							message: new Message().addText('好像原来的笔记本记不下了，先帮你记到Inbox里了'),
						});
					}
				} else vault.append(file as TFile, nowTitle);

				message.addText('记录完成√\n---------');

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
			}
		});
};
