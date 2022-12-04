import { exec } from 'child_process';
import type { MiraiBotSettings } from 'src/type';
import { getParsedHtml, streamToString } from 'src/utils';
import { getRealFilePath } from '../utils';

const headers = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
	'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
	'cache-control': 'max-age=0',
	'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
	'sec-ch-ua-mobile': '?0',
	'sec-ch-ua-platform': '"Windows"',
	'sec-fetch-dest': 'document',
	'sec-fetch-mode': 'navigate',
	'sec-fetch-site': 'cross-site',
	'sec-fetch-user': '?1',
	'upgrade-insecure-requests': '1',
};

export async function getWod({ imageFolder }: MiraiBotSettings) {
	const requestUrl = 'https://www.merriam-webster.com/word-of-the-day';
	const doc = await getParsedHtml(requestUrl, headers);
	if (!doc) return {};
	const $ = (s: string) => doc.querySelector(s);
	// @ts-ignore
	const cover = $('meta[property="og:image"]')?.content;
	// @ts-ignore
	const link = $('meta[property="og:url"]')?.content;
	// @ts-ignore
	const description = $('meta[property="og:description"]')?.content;
	// @ts-ignore
	const episode = $('#art19-podcast-player')?.attributes['data-episode-id']?.value;
	const mediaUrl = `https://rss.art19.com/episodes/${episode}.mp3`;
	const title = $('h1')?.textContent ?? '';
	const definition = $('div.wod-definition-container>p')?.textContent ?? '';
	const didYouKnow = $('div.did-you-know-wrapper>p')?.textContent ?? '';
	//@ts-ignore
	const botFolder = app.vault.adapter.basePath + '/' + app.vault.configDir + '/mirai-bot';
	const botTempFolder = botFolder + '/temp';
	const pcmPath = botTempFolder + '/' + title + '.pcm';
	const slkPath = botTempFolder + '/' + title + '.slk';
	//@ts-ignore
	const mp3Path = app.vault.adapter.basePath + '/' + imageFolder + '/' + title + '.mp3';
	const pyPath = botFolder + '/any2slk.py';
	const cmdStr = `pwsh.exe -c python ${pyPath} ${mp3Path} ${pcmPath} ${slkPath} '${mediaUrl.replace(/&/g, '^&')}'`;
	console.log('🚀 ~ cmdStr', cmdStr);
	const { stdout } = await exec(cmdStr);
	let voicePath = await streamToString(stdout);
	if (voicePath != slkPath) voicePath = slkPath;
	const date = window.moment().format('YYYY-MM-DD');
	return {
		mediaUrl,
		definition,
		didYouKnow,
		link,
		cover,
		description,
		title,
		voicePath,
		media: getRealFilePath(imageFolder + '/' + title + '.mp3'),
		date,
	};
}
