import type { RecordDetail } from 'src/type';
import { getDailyNoteFile, saveRecord, sendImage, sendText } from 'src/utils';
export async function review() {
	const today = window.moment();
	const reviewDate = today.subtract(2, 'months');
	const reviewNote = await getDailyNoteFile(reviewDate);
	const { frontmatter } = app.metadataCache.getFileCache(reviewNote) ?? {};
	const banner = frontmatter?.banner?.match(/https?:\/\/.*/)
		? frontmatter?.banner
		: frontmatter?.banner ?? 'https://lg-09hkq0ro-1256247830.cos.ap-shanghai.myqcloud.com/202211120004872.jpg';
	const highlight = frontmatter?.highlight ?? '大概是平静的一天';
	const activities = frontmatter?.activity?.join('，') ?? '没有记录活动';
	const category = '📆回顾笔记';
	const brief = reviewNote.basename;
	const briefLink = `obsidian://advanced-uri?vault=${app.vault.getName()}&filename=${encodeURI(brief)}&openmode=true`;
	const details: RecordDetail[] = [
		{ type: 'image', content: banner },
		{ type: 'text', content: activities },
		{ type: 'text', content: highlight },
	];
	await saveRecord({ category, brief, briefLink, details });
	await sendText(`回顾一下${reviewNote.basename}的日记吧~`);
	await sendImage(banner);
	await sendText(highlight);
	await sendText(activities);
	const content = (await app.vault.cachedRead(reviewNote)).replace(/^---.*---\n*/s, '');
	if (content) await sendText(content);
}
