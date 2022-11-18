import { getParsedHtml } from './utils';

const headers = {
	authority: 'www.bilibili.com',
	'cache-control': 'max-age=0',
	'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Windows"',
	'upgrade-insecure-requests': '1',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'sec-fetch-site': 'none',
	'sec-fetch-mode': 'navigate',
	'sec-fetch-user': '?1',
	'sec-fetch-dest': 'document',
	'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
};
export async function getBiliInfo(url: string) {
	const cleanUrl = url.replace(/\?.*/g, '');
	const doc = await getParsedHtml(cleanUrl, headers);
	if (!doc) return {};
	const $ = (s: any) => doc.querySelector(s);
	let cover: string = $("meta[property='og:image']")?.content?.replace(/@.*/g, '');
	if (!cover) return {};
	cover = cover.startsWith('http') ? cover : 'https:' + cover;
	const date = $("meta[itemprop='uploadDate']")?.content;
	const author = $("meta[name='author']")?.content;
	const title = $("meta[property='og:title']")?.content?.replace(/_哔哩哔哩_bilibili$/g, '');
	const link = $("meta[property='og:url']")?.content;

	return { cover, title, author, date, link };
}
