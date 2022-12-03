import { type Bot, Message } from 'mirai-js';
import type { TFile } from 'obsidian';
import type MiraiBot from 'src/main';
import { getBookInfo, searchDouban } from 'src/scripts/doubanBook';
import { createNoteFromRecord } from 'src/utils';
import { picService } from './mediaMessage';

export const noteFromBot = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile, mode?: 'todo' | 'normal') => {
	const { waitFor } = data;
	const vault = app.vault;
	await bot.sendMessage({ friend: plugin.settings.myQQ, message: new Message().addText('有在认真听~') });
	let nowTitle = '\n- ' + window.moment().format('HH:mm');
	let todoSign = '';
	if (mode == 'todo') {
		nowTitle += ' 🔍待办: ';
		todoSign = '- [ ] ';
	} else {
		nowTitle += ' ✏️随笔: ';
	}
	const message = new Message().addText('记录完成~');
	let next = await waitFor.messageChain();
	let note = next[1];
	let isFirst = true;
	// eslint-disable-next-line no-loops/no-loops
	while (note.type != 'Plain' || !['结束'].includes(note.text)) {
		if (isFirst) {
			message.addText('\n---------\n');
			vault.append(file as TFile, nowTitle);
			isFirst = false;
		}
		if (note.type === 'Plain') {
			const plain = '\n\t' + todoSign + note.text.replace(/\n/g, '\n\t');
			message.addText(note.text + '\n');
			vault.append(file as TFile, plain);
		} else if (note.type === 'Image' && mode != 'todo') {
			await picService(data, bot, plugin, file, false, next);
			message.addImageUrl(note.url ?? '');
		}
		next = await waitFor.messageChain();
		note = next[1];
	}
	await bot.sendMessage({ friend: plugin.settings.myQQ, message: message });
};

export const bookService = async (data: any, bot: Bot, plugin: MiraiBot, file: TFile) => {
	const book = data.text.replace('摘录 ', '');
	const bookFileName = book?.replace(/[\\/:*?"<>|\n]/g, '_');
	const bookFilePath = plugin.settings.tempFolder + '/' + bookFileName + '.md';
	let bookFile = app.vault.getAbstractFileByPath(bookFilePath);
	if (!bookFile) {
		const bookList = await searchDouban(book);
		if (bookList.length == 0) bookFile = await app.vault.create(bookFilePath, '');
		else {
			const items = bookList.map((e) => e.text).join('\n');
			const message = new Message().addText('还没有创建过这本书哦，从下面选择一个创建吧~\n').addText(items);
			await bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: message,
			});
			const index = parseInt(await data.waitFor.friend(plugin.settings.myQQ).text());
			if (index && index >= 1 && index <= bookList.length) {
				const infoData = await getBookInfo(bookList[index - 1].url);
				bookFile = await createNoteFromRecord(
					infoData,
					'📖读书',
					plugin,
					file,
					plugin.settings.templates['templateBookPath'],
				);
			} else {
				return;
			}
		}
	} else {
		const { getPropertiesInFile } = app.plugins.plugins['metaedit'].api;
		const properties = (await getPropertiesInFile(bookFile as TFile))?.find(
			(p: { key: string }) => p.key == 'banner',
		);
		const banner = properties['content'];
		const record = `\n- ${window.moment().format('HH:mm')} 📖读书: [[${bookFileName}]]\n![|300](${banner})`;
		await app.vault.append(file as TFile, record);
	}
	await bot.sendMessage({
		friend: plugin.settings.myQQ,
		message: new Message().addText('准备好做摘录了！'),
	});
	const quote: string = await data.waitFor.friend(plugin.settings.myQQ).text();
	if (quote != '取消') {
		app.vault.append(bookFile as TFile, '\n\n> ' + quote).then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('✏️摘录已完成~'),
			});
		});
		await ideaService(data, bot, plugin, bookFile as TFile).then((idea) => {
			if (idea) app.vault.append(file as TFile, '\n' + idea);
		});
	}
};

export const ideaService = async (
	data: any,
	bot: Bot,
	plugin: MiraiBot,
	file: TFile,
	{ idea, newFile }: { idea?: string; newFile?: TFile } = {},
) => {
	if (!idea) idea = await data.waitFor.friend(plugin.settings.myQQ).text();

	if (idea?.startsWith('想法')) {
		app.vault.append(file as TFile, '\n\t' + idea.replace(/\n/gm, '\n\t')).then(() => {
			bot.sendMessage({
				friend: plugin.settings.myQQ,
				message: new Message().addText('💡想法已记录~'),
			});
		});
		if (newFile) {
			const { update } = app.plugins.plugins['metaedit'].api;
			await update('highlight', idea.replace('想法 ', ''), newFile);
		}
		return idea.replace('想法 ', '');
	}
};

export const tempTextService = async (text: string, bot: Bot, plugin: MiraiBot, file: TFile, title = '📒记录文本') => {
	app.vault.append(file as TFile, `\n- ${window.moment().format('HH:mm')} ${title}: \n\t` + text?.trim()).then(() => {
		bot.sendMessage({
			friend: plugin.settings.myQQ,
			message: new Message().addText('文本已记录~'),
		});
	});
};
