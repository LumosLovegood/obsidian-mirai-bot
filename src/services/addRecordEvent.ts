import { type TAbstractFile, TFile } from 'obsidian';
import type { RecordDetail } from 'src/type';
import { getDailyNoteFile, saveRecord } from 'src/utils';

export async function addVaultEventRecord(file: TAbstractFile) {
	if (!(file instanceof TFile)) return;
	if (file.extension != 'md') return;
	const dailyNote = await getDailyNoteFile();
	if (file.basename === dailyNote.basename) return;
	const content = await app.vault.cachedRead(file);
	if (content === '') return;
	const category = '📓新建笔记';
	const brief = file.basename;
	const briefLink = `obsidian://advanced-uri?vault=${app.vault.getName()}&filename=${encodeURI(brief)}&openmode=true`;
	const details: RecordDetail[] = [];
	const { frontmatter, tags } = app.metadataCache.getFileCache(file) ?? {};
	if (frontmatter?.banner) {
		const banner = frontmatter?.banner?.match(/https?:\/\/.*/)
			? `![|300](${frontmatter?.banner})`
			: frontmatter?.banner;
		details.push({ type: 'image', content: banner });
	}
	if (tags)
		details.push({
			type: 'text',
			content: `标签: ${tags.map((t) => t.tag.replace('#', '')).toLocaleString()}`,
		});
	await saveRecord({ category, brief, briefLink, details });
}
