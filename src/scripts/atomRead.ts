import TurndownService from 'turndown';
import { getParsedHtml } from '../utils';

const headers = {
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
	'Cache-Control': 'max-age=0',
	Connection: 'keep-alive',
	'Sec-Fetch-Dest': 'document',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'none',
	'Sec-Fetch-User': '?1',
	'Upgrade-Insecure-Requests': '1',
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
	'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Windows"',
};

export async function getAtomRead(url: string) {
	const doc = await getParsedHtml(url, headers);
	if (!doc) return {};
	const $ = (s: string) => doc.querySelector(s);
	const header = $('div.vivo-news-header')?.attributes;
	if (!header) return {};
	// @ts-ignore
	const date = parseInt(header['data-publish-time']?.textContent);
	// @ts-ignore
	const author = header['data-author-name']?.textContent;
	const title = $('title')?.textContent;
	let contentHtml = $('div.vivo-news-content')?.innerHTML;
	contentHtml = contentHtml?.replace(/<img.+?>/g, (f: string) => {
		const imgMatch = f.match(/(?<=src=")http.*?(?=")/);
		if (imgMatch) {
			return `\n![](${imgMatch[0]})\n`;
		}
		return '';
	});

	const turndownService = new TurndownService({
		headingStyle: 'atx',
		hr: '---',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
	});
	let content = '';
	if (contentHtml) {
		content =
			turndownService
				?.turndown(contentHtml)
				?.replace(/\\(?=\[|\])/gm, '')
				?.replace(/(?<!\\)\\(?!\\)/gm, '') ?? '';
	}
	const coverMatch = content?.match(/(?<=!\[\]\().*?(?=\))/);
	const cover = coverMatch ? coverMatch[0] : '';

	return { content, author, date, title, link: url, cover };
}
