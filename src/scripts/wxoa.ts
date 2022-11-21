import TurndownService from 'turndown';
import { getParsedHtml } from './utils';

const headers = {
	authority: 'mp.weixin.qq.com',
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
	'cache-control': 'max-age=0',
	'if-modified-since': 'Fri, 18 Nov 2022 00:45:47 +0800',
	'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Windows"',
	'sec-fetch-dest': 'document',
	'sec-fetch-mode': 'navigate',
	'sec-fetch-site': 'none',
	'sec-fetch-user': '?1',
	'upgrade-insecure-requests': '1',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
};

export async function getWxoa(url: string) {
	const cleanUrl = url.replace(/&chk.*/g, '');
	const doc = await getParsedHtml(cleanUrl, headers);
	if (!doc) return {};
	const $ = (s: string) => doc.querySelector(s);
	const author = $('#js_name')?.textContent?.trim() ?? '';
	// @ts-ignore
	const title = $('meta[property="og:title"]')?.content ?? '';
	// @ts-ignore
	const cover = $('meta[property="og:image"]')?.content ?? '';
	// @ts-ignore
	const link = $("meta[property='og:url']")?.content ?? '';
	let date = 0;
	const dateMatch = $('#activity-detail > script:nth-child(38)')?.textContent?.match(/(?<=ct = ")\d+/gm);
	if (dateMatch) date = parseInt(dateMatch[0]) * 1000;

	const turndownService = new TurndownService({
		headingStyle: 'atx',
		hr: '---',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
	});
	let html = $('#js_content')?.innerHTML;
	html = html?.replace(/<img.*?>/g, (f: string) => {
		const imgMatch = f.match(/(?<=src=").*?(?=\?)/);
		if (imgMatch) {
			return `\n![](${imgMatch[0]})\n`;
		}
		return '';
	});
	let content = '';
	if (html) {
		content =
			turndownService
				?.turndown(html)
				?.replace(/\\(?=\[|\])/gm, '')
				?.replace(/(?<!\\)\\(?!\\)/gm, '')
				?.replace(/\n+ +\n+/gm, '\n') ?? '';
	}
	return { content, author, date, title, link, cover };
}
