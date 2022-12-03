import { getDailyNoteFile } from 'src/utils';
export async function autoCreateDiary() {
	const today = window.moment();
	const todayNote = await getDailyNoteFile(today);
	const reviewDate = today.subtract(2, 'months');
	const reviewNote = await getDailyNoteFile(reviewDate);
	const { frontmatter } = app.metadataCache.getFileCache(reviewNote) ?? {};
	const banner = frontmatter?.banner?.match(/https?:\/\/.*/)
		? `![|300](${frontmatter?.banner})`
		: frontmatter?.banner ??
		  '![|300](https://lg-09hkq0ro-1256247830.cos.ap-shanghai.myqcloud.com/202211120004872.jpg)';
	const highlight = frontmatter?.highlight ?? '大概是平静的一天';
	const activities = frontmatter?.activity?.join('，') ?? '没有记录活动';
	const record = `\n- ${window.moment().format('HH:mm')} 回顾笔记: [[${
		reviewNote.basename
	}]]\n\t${banner}\n\t${activities}\n\t${highlight}`;
	await app.vault.append(todayNote, record);
}
