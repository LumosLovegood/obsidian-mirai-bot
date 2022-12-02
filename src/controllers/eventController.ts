import { TAbstractFile, TFile } from 'obsidian';
import type MiraiBot from '../main';
import { getDailyNoteFile } from '../utils';
export default function registerEvents(plugin: MiraiBot) {
	setTimeout(() => {
		plugin.registerEvent(
			app.vault.on('create', (file) => {
				addVaultEventRecord(plugin, file);
			}),
		);
		plugin.registerEvent(
			app.vault.on('rename', (file) => {
				addVaultEventRecord(plugin, file);
			}),
		);
	}, 5000);
}

export async function addVaultEventRecord(plugin: MiraiBot, file: TAbstractFile) {
	if (plugin.botManager.creating) return;
	const dailyNote = await getDailyNoteFile();
	if (!(file instanceof TFile)) return;
	if (file.extension != 'md') return;
	const content = await app.vault.cachedRead(file);
	if (content === '') return;
	let record: string;
	if (file.basename === dailyNote.basename) {
		const past = window.moment().subtract(2, 'months');
		const target = await getDailyNoteFile(window.moment(past));
		const { frontmatter } = app.metadataCache.getFileCache(target) ?? {};
		const banner = frontmatter?.banner?.match(/https?:\/\/.*/)
			? `![|300](${frontmatter?.banner})`
			: frontmatter?.banner ??
			  '![|300](https://lg-09hkq0ro-1256247830.cos.ap-shanghai.myqcloud.com/202211120004872.jpg)';
		const highlight = frontmatter?.highlight ?? '大概是平静的一天';
		const activities = frontmatter?.activity?.join('，') ?? '没有记录活动';
		record = `\n- ${window.moment().format('HH:mm')} 回顾笔记: [[${
			target.basename
		}]]\n\t${banner}\n\t${activities}\n\t${highlight}`;
	} else {
		const { frontmatter, tags } = app.metadataCache.getFileCache(file) ?? {};
		record = `\n- ${window.moment().format('HH:mm')} 新建笔记: [[${file.basename}]]\n`;
		if (frontmatter?.banner) {
			const banner = frontmatter?.banner?.match(/https?:\/\/.*/)
				? `![|300](${frontmatter?.banner})`
				: frontmatter?.banner;
			record += `\n\t${banner}`;
		}
		if (tags) record += `\n\t标签: ${tags.map((t) => t.tag.replace('#', '')).toLocaleString()}`;
	}
	await app.vault.append(dailyNote, record);
}
