import type { TFile } from 'obsidian';
import type MiraiBot from 'src/main';
import { getBookInfo, searchDouban } from 'src/scripts/doubanBook';
import type { ActivityRecord, RecordDetail } from 'src/type';
import { saveRecord, sendText } from 'src/utils';
import { createNoteFromRecord } from './appShareMessage';

// export const noteFromBot = async (plugin: MiraiBot, waitFor: any, mode?: 'todo' | 'normal') => {
// 	await sendText('有在认真听~');
// 	let category = '✏️随笔';
// 	let todoSign = '';
// 	if (mode == 'todo') {
// 		category = '🔍待办';
// 		todoSign = '- [ ] ';
// 	}
// const message = new Message().addText('记录完成~');
// let next = await waitFor.messageChain();
// let note = next[1];
// let isFirst = true;
// // eslint-disable-next-line no-loops/no-loops
// while (note.type != 'Plain' || !['结束'].includes(note.text)) {
// 	if (isFirst) {
// 		message.addText('\n---------');
// 		isFirst = false;
// 	}
// 	if (note.type === 'Plain') {
// 		record.details.push({ type: 'text', content: todoSign + note.text });
// 		message.addText('\n' + note.text);
// 	} else if (note.type === 'Image' && mode != 'todo') {
// 		record.details.push(await picService(plugin, false, next));
// 		message.addImageUrl(note.url ?? '');
// 	}
// 	next = await waitFor.messageChain();
// 	note = next[1];
// }
// await saveRecord(record);
// await sendMessage(message);
// };

export const bookService = async (book: string, waitFor: any, plugin: MiraiBot) => {
	const bookFileName = book?.replace(/[\\/:*?"<>|\n]/g, '_');
	const bookFilePath = plugin.settings.tempFolder + '/' + bookFileName + '.md';
	let bookFile = app.vault.getAbstractFileByPath(bookFilePath);
	if (!bookFile) {
		const bookList = await searchDouban(book);
		if (bookList.length == 0) bookFile = await app.vault.create(bookFilePath, '');
		else {
			const items = bookList.map((e) => e.text).join('\n');
			await sendText('还没有创建过这本书哦，从下面选择一个创建吧~\n' + items);
			const index = parseInt(await waitFor.friend(plugin.settings.myQQ).text());
			if (index && index >= 1 && index <= bookList.length) {
				const infoData = await getBookInfo(bookList[index - 1].url);
				bookFile = await createNoteFromRecord(
					infoData,
					'📖读书',
					plugin,
					plugin.settings.templates['templateBookPath'],
				);
			} else return;
		}
	} else {
		const { getPropertiesInFile } = app.plugins.plugins['metaedit'].api;
		const properties = (await getPropertiesInFile(bookFile as TFile))?.find(
			(p: { key: string }) => p.key == 'banner',
		);
		const banner = properties['content'];
		const record: ActivityRecord = {
			time: '',
			category: '',
			brief: '',
			briefLink: '',
			details: [],
		};
		record.time = window.moment().format('HH:mm');
		record.category = '📖读书';
		record.brief = bookFileName;
		record.briefLink = `obsidian://advanced-uri?vault=${app.vault.getName()}&filename=${encodeURI(
			record.brief,
		)}&openmode=true`;
		record.details.push({ type: 'image', content: banner });
		await saveRecord(record);
	}
	await sendText('准备好做摘录了！');
	const quote: string = await waitFor.friend(plugin.settings.myQQ).text();
	if (quote != '结束') {
		app.vault.append(bookFile as TFile, '\n\n> ' + quote);
		await sendText('✏️摘录已完成~');
	}
};

export const textService = async (text: string) => {
	const category = '🔍小记';
	const details: RecordDetail[] = [{ type: 'text', content: text }];
	const brief = '';
	const briefLink = '';
	await saveRecord({ category, brief, briefLink, details });
	await sendText('已记录~');
};
