import { getParsedHtml } from './utils';

const headers = {
	authority: 'www.zhihu.com',
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
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

export async function getZhihu(url: string) {
	const cleanUrl = url.replace(/\?.*/g, '');
	const doc = await getParsedHtml(cleanUrl, headers);
	if (!doc) return {};
	const $ = (s: string) => doc.querySelector(s);
	// @ts-ignore
	const date = $('meta[itemprop="dateModified"]').content;
	// @ts-ignore
	const author = $('div.AuthorInfo>meta[itemprop="name"]')?.content;
	const title = $('h1')?.textContent;
	const html = $('div.RichContent-inner > div > span')?.innerHTML;
	let content = html?.replace(/<p.*?\/p>/g, (p: string) => {
		const pMatch = p.match(/(?<=>).*?(?=<)/g);
		if (pMatch) {
			return pMatch[0] + '\n';
		}
		return '';
	});
	content = content?.replace(/<figure.*?\/figure>/g, (f: string) => {
		const imgMatch = f.match(/http.*?(?=")/);
		if (imgMatch) {
			return `\n![](${imgMatch[0]})\n`;
		}
		return '';
	});
	const coverMatch = content?.match(/(?<=!\[\]\().*?(?=\))/);
	const cover = coverMatch ? coverMatch[0] : '';
	return { author, title, content, link: cleanUrl, date, cover };
}
