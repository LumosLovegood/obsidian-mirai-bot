import { type TAbstractFile, TFile } from 'obsidian';
import type MiraiBot from 'src/main';
import { getDailyNoteFile } from 'src/utils';

export async function addVaultEventRecord(plugin: MiraiBot, file: TAbstractFile) {
	if (plugin.botManager.creating) return;
	if (!(file instanceof TFile)) return;
	if (file.extension != 'md') return;
	const dailyNote = await getDailyNoteFile();
	if (file.basename === dailyNote.basename) return;
	const content = await app.vault.cachedRead(file);
	if (content === '') return;
	let record: string;
	const { frontmatter, tags } = app.metadataCache.getFileCache(file) ?? {};
	record = `\n- ${window.moment().format('HH:mm')} 新建笔记: [[${file.basename}]]\n`;
	if (frontmatter?.banner) {
		const banner = frontmatter?.banner?.match(/https?:\/\/.*/)
			? `![|300](${frontmatter?.banner})`
			: frontmatter?.banner;
		record += `\n\t${banner}`;
	}
	if (tags) record += `\n\t标签: ${tags.map((t) => t.tag.replace('#', '')).toLocaleString()}`;
	await app.vault.append(dailyNote, record);
}
