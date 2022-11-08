import fetch from 'node-fetch';

fetch(
	'http://120.233.18.94/?ver=2&rkey=3062020101045b30590201010201000204c4a6ed0404243138504f5a65385755356c6d5a6d6c3537444544727166785a41644242704d777041504c0204636a1e32041f0000000866696c6574797065000000013000000005636f64656300000001310400&voice_codec=1&filetype=0',
	{
		headers: {
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
			'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
			'Proxy-Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
		},
	},
).then((res) => console.log(res));
