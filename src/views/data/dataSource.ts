import type { TFile } from 'obsidian';
import { getAllDailyNotes } from 'obsidian-daily-notes-interface';
import type { ActivityRecord, MiraiBotSettings, RecordDetail } from 'src/type';
import { getDailyNoteFile, getRealFilePath } from 'src/utils';

export async function parseActivities(settings: MiraiBotSettings, date: moment.Moment) {
	const vaultName = encodeURI(app.vault.getName());
	const file = await getDailyNoteFile(date);
	const records = (await app.vault.read(file as TFile)).replace(
		new RegExp(`.*${settings.timelineIdentifier}`, 's'),
		'',
	);
	let activities: ActivityRecord[] = [];
	const recordReg =
		/(?:\n|^)- (\d\d:\d\d) (.+?): ?(?: \[{1,2}(.+?)\]{1,2}(?:\((.+?)\))?)?\n\t?((?:.|\n)*?)?(?=(?:\n- |$))/g;
	activities = [...records.matchAll(recordReg)].map((item) => {
		const time = item[1] ?? '';
		const category = item[2] ?? '';
		const brief = item[3] ?? '';
		const briefLink = item[4]
			? `obsidian://web-open?url=${encodeURIComponent(item[4])}`
			: `obsidian://advanced-uri?vault=${vaultName}&filename=${encodeURI(brief)}&openmode=true`;
		let details: RecordDetail[] = item[5]?.split('\n').map((line) => {
			line = line.trim();
			let match;
			if (line.match(/!\[.*?audio.*?\]\((.*)\)/)) {
				match = line.match(/!\[.*?audio.*?\]\((.*)\)/);
				const content = match ? getRealFilePath(match[1]) : '';
				return { type: 'audio', content };
			}
			if (line.match(/!\[.*\]\((.*)\)/)) {
				match = line.match(/!\[.*\]\((.*)\)/);
				const content = match ? getRealFilePath(match[1]) : '';
				return { type: 'image', content };
			}
			if (line.match(/(?<=<iframe src=').*?(?=')/)) {
				match = line.match(/(?<=<iframe src=').*?(?=')/);
				return { type: 'iframe', content: match ? match[0] : '' };
			}
			const content = line
				.replace(/\[\[(.*)\]\]/g, function (...args) {
					const fileName = args[1];
					return `<a href="obsidian://advanced-uri?vault=${vaultName}&filename=${encodeURI(fileName)}&openmode=true" style="text-decoration-line: none;">${fileName}</a>`;
				})
				.replace(/(?<!!)\[(.*)\]\((.*)\)/g, function (...args) {
					const title = args[1];
					const url = args[2];
					return `<a href="obsidian://web-open?url=${encodeURIComponent(
						url,
					)}" style="text-decoration-line: none;">${title}</a>`;
				})
				.replace(/https?:.*?(?=\s|$)/g, (r) => {
					return `<a href="obsidian://web-open?url=${encodeURIComponent(r)}">${r}</a>`;
				})
				.replace(/- \[(.)\] (.*)/, function (...args) {
					console.log(args[1]);
					return `<input type="checkbox" ${args[1] === 'x' ? 'checked' : ''} disabled> ${args[2]}`;
				});
			return { type: 'text', content };
		});
		details.forEach((value, index, array) => {
			if (index > 0 && value.type === 'text' && array[index - 1].type === 'text') {
				value.content = array[index - 1].content + '<br/>' + value.content;
				array[index - 1].content = '';
			}
		});
		details = details.filter((d) => d.content != '');
		console.log('🚀 ~ details', details);
		return { time, category, brief, details, briefLink };
	});
	const botFolder = app.vault.configDir + '/mirai-bot/';
	const dataPath = botFolder + `data/${date.format('YYYY-MM-DD')}.json`;
	await app.vault.adapter.write(dataPath, JSON.stringify(activities));
}

export function getHeatmapData() {
	const data = Object.entries(getAllDailyNotes()).map((item) => {
		const date = item[0].replace('day-', '');
		const file: TFile = item[1];
		const value = file.stat.size;
		return { date, value };
	});
	return data;
}

export async function getActivities(settings: MiraiBotSettings, date?: moment.Moment) {
	if (!date) date = window.moment();
	const botFolder = app.vault.configDir + '/mirai-bot/';
	const dataPath = botFolder + `data/${date.format('YYYY-MM-DD')}.json`;
	if (!(await app.vault.adapter.exists(dataPath))) {
		await parseActivities(settings, date);
		console.log('pasing...');
	}
	const activities: ActivityRecord[] = JSON.parse(await app.vault.adapter.read(dataPath));
	return activities.map((item) => {
		item.details = item.details.map((d) => {
			if (d.type != 'text') return d;
			d.content = d.content
				.replace(/(?<!!)\[(.*)\]\((.*)\)/g, function (...args) {
					const title = args[1];
					const url = args[2];
					return `<a href="obsidian://web-open?url=${encodeURIComponent(
						url,
					)}" style="text-decoration-line: none;">${title}</a>`;
				})
				.replace(/https?:.*?(?=\s|$)/g, (r) => {
					return `<a href="obsidian://web-open?url=${encodeURIComponent(
						r,
					)}" style="word-break:break-all">${r}</a>`;
				})
				.replace(/^。(.+)/, function (...args) {
					console.log(args[1]);
					return `<input type="checkbox" ${args[1] === 'x' ? 'checked' : ''} disabled> ${args[2]}`;
				});
			return d;
		});
		return item;
	});
}
