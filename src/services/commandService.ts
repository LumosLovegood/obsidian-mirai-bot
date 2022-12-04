import type { TFile } from 'obsidian';
import { getBookInfo, searchDouban } from 'src/scripts/doubanBook';
import type { RecordDetail } from 'src/type';
import { saveRecord } from 'src/utils';
import { feedback } from '../utils';
import { BookModal } from '../views/suggestModal';
import { createNoteFromRecord } from './shareService';

export const bookService = async (book: string, waitFor?: any) => {
	const plugin = app.plugins.plugins['obsidian-mirai-bot'];
	const bookFileName = book?.replace(/[\\/:*?"<>|\n]/g, '_');
	const feedbackTo = waitFor ? 'bot' : 'obsidian';
	let bookFile = app.metadataCache.getFirstLinkpathDest(bookFileName, '');
	if (!bookFile) {
		const bookList = await searchDouban(book);
		if (bookList.length == 0) {
			feedback('没有找到书籍', feedbackTo);
			return;
		}
		if (waitFor) {
			const items = bookList.map((e) => e.text).join('\n');
			await feedback('还没有创建过这本书哦，从下面选择一个创建吧~\n' + items, feedbackTo);
			const index = parseInt(await waitFor.friend(plugin.settings.myQQ).text());
			if (index && index >= 1 && index <= bookList.length) {
				const infoData = await getBookInfo(bookList[index - 1].url);
				bookFile = await createNoteFromRecord({ ...infoData, source: '📖读书' }, 'templateBookPath');
			} else return;
			await feedback('准备好做摘录了！', feedbackTo);
		} else {
			new BookModal(bookList);
		}
		return;
	}
	if (!waitFor) {
		let isOpend = false;
		app.workspace.iterateAllLeaves((leaf) => {
			// @ts-ignore
			if (leaf.view.file?.path === bookFile?.path) {
				isOpend = true;
				app.workspace.setActiveLeaf(leaf, { focus: true });
			}
		});
		if (!isOpend) app.workspace.openLinkText(bookFile.path, '', true);
	}
	const { getPropertiesInFile } = app.plugins.plugins['metaedit'].api;
	const properties = (await getPropertiesInFile(bookFile as TFile))?.find((p: { key: string }) => p.key == 'banner');
	const banner = properties['content'];
	const category = '📖读书';
	const brief = bookFileName;
	const briefLink = `obsidian://advanced-uri?vault=${app.vault.getName()}&filename=${encodeURI(brief)}&openmode=true`;
	const details: RecordDetail[] = [{ type: 'image', content: banner }];
	await saveRecord({ category, brief, briefLink, details });
	await feedback('准备好做摘录了！', feedbackTo);
};
