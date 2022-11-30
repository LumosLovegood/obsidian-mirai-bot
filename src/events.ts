import { TAbstractFile, TFile } from 'obsidian';
import type MiraiBot from './main';
import { getDailyNoteFile } from './utils';
export default function registerEvents(plugin: MiraiBot) {
	plugin.registerEvent(
		app.vault.on('create', async (file) => {
			await addVaultEventRecord(plugin, file);
		}),
	);
}

export async function addVaultEventRecord(plugin: MiraiBot, file: TAbstractFile) {
	if (!app.plugins.plugins['dataview']) return;
	if (plugin.botManager.creating) return;
	const dailyNote = await getDailyNoteFile();
	if (!(file instanceof TFile)) return;
	const content = await app.vault.cachedRead(file);
	console.log('🚀 ~ content', content);
	if (content === '') return;
	const { frontmatter, tags } = app.metadataCache.getFileCache(file) ?? {};
	console.log('🚀 ~ app.metadataCache.getFileCache(file)', app.metadataCache.getFileCache(file));
	let record = `\n- ${window.moment().format('HH:mm')} 新建笔记: [[${file.basename}]]`;
	if (frontmatter?.banner) {
		const banner = frontmatter?.banner?.match(/https?:\/\/.*/)
			? `![|300](${frontmatter?.banner})`
			: frontmatter?.banner;
		record += `\n\t${banner}`;
	}
	if (tags) record += `\n\t标签: ${tags.map((t) => t.tag.replace('#', '')).toLocaleString()}`;
	await app.vault.append(dailyNote, record);
}
