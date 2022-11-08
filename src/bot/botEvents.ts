import { Bot, Message, Middleware } from 'mirai-js';
import { TFile } from 'obsidian';
import MiraiBot from '../main';
import { getBiliInfo } from '../scripts/bilibili';
// import { uploadUrlImage } from '../utils/uploadImage';

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

export const note = function (bot: Bot, plugin: MiraiBot) {
	const vault = plugin.app.vault;

	return new Middleware()
		.textProcessor()
		.friendLock({ autoUnlock: true })
		.syncWrapper()
		.done(async ({ waitFor, text, sender: { id } }) => {
			console.log(text);
			if (['写点东西', '记点东西'].includes(text)) {
				const fileName = window.moment().format(plugin.settings.diary.format);
				const filePath = plugin.settings.diary.folder + '/' + fileName + '.md';
				const file = vault.getAbstractFileByPath(filePath);
				const nowTitle = '\n##### ' + window.moment().format('M月D日 HH:mm') + '\n';

				if (!file) return;
				vault.append(file as TFile, nowTitle);
				await bot.sendMessage({ friend: id, message: new Message().addText('有在认真听~') });
				const message = new Message().addText('记录完成√\n---------');

				let note = (await waitFor.messageChain())[1];

				// eslint-disable-next-line no-loops/no-loops
				while (!['写完了', '记录完毕', '结束'].includes(note.text ?? '')) {
					if (note.type === 'Plain') {
						if (note.text === '换行') {
							vault.append(file as TFile, '\n');
						} else {
							vault.append(file as TFile, `${note.text ?? ''}。`);
							message.addText('\n' + note.text);
						}
					} else {
						// (await uploadUrlImage(note.url)) ??
						vault.append(file as TFile, `\n![](${note.url})`);
						message.addImageUrl(note.url ?? '');
					}
					note = (await waitFor.messageChain())[1];
				}
				await bot.sendMessage({ friend: id, message: message });
			}
		});
};
