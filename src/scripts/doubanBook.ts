import { getParsedHtml } from '../utils';

const headers = {
	'Content-Type': 'text/html; charset=utf-8',
	Connection: 'keep-alive',
	'Upgrade-Insecure-Requests': '1',
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Windows"',
	'Sec-Fetch-Site': 'same-site',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-User': '?1',
	'Sec-Fetch-Dest': 'document',
	Referer: 'https://m.douban.com/',
	'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
};
const bookPre = 'https://book.douban.com/subject/';

export async function searchDouban(name: string) {
	const url = 'https://www.douban.com/search/?q=' + name;
	const doc = await getParsedHtml(url, headers);
	const itemList: { text: string; url: string; cover: string }[] = [];
	if (!doc) return itemList;
	const $ = (s: string) => doc.querySelector(s);
	const re = $('.result-list');
	if (!re) {
		return itemList;
	}
	const result = re.querySelectorAll('.result');
	let count = 1;
	result?.forEach((item) => {
		// @ts-ignore
		const value = item?.querySelector('h3 a')?.attributes?.onclick?.value;
		if (value.includes('book')) {
			const text =
				count++ +
				'.《' +
				item?.querySelector('h3 a')?.textContent?.trim() +
				'》' +
				item?.querySelector('.subject-cast')?.textContent?.trim();
			const url = bookPre + value.match(/\d+(?=,)/g);
			// @ts-ignore
			const cover = item?.querySelector('img')?.attributes?.src?.textContent;
			itemList.push({ text, url, cover });
		}
	});
	return itemList;
}

export async function getBookInfo(url: string) {
	const doc = await getParsedHtml(url, headers);
	if (!doc) return {};
	const $ = (s: string) => doc.querySelector(s);
	// @ts-ignore
	const title = $("meta[property='og:title']")?.content;
	// @ts-ignore
	const author = $("meta[property='book:author']")?.content.replace(/[[\]()（）]/g, '');
	// @ts-ignore
	const isbn = $("meta[property='book:isbn']")?.content;
	// @ts-ignore
	const cover = $("meta[property='og:image']")?.content;
	const dateMatch = $('#info')
		?.textContent?.replace('\n', '')
		?.match(/(?<=出版年:\s*)[\S ]+/g);
	const date = dateMatch ? dateMatch[0]?.trim() : '-';
	const originMatch = $('#info')
		?.textContent?.replace('\n', '')
		?.match(/(?<=原作名:\s*)[\S ]+/g);
	const origin = originMatch ? originMatch[0] : '-';

	return { title, author, isbn, cover, date, origin, link: url };
}
