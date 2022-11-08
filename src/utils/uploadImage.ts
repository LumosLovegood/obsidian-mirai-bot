import { requestUrl } from 'obsidian';

export const uploadUrlImage = async (imageUrl: string | undefined) => {
	if (!imageUrl) return;
	const res = await requestUrl({
		url: 'http://127.0.0.1:36677/upload',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ list: [imageUrl] }),
	});
	const data = res.json;
	if (res.status !== 200) {
		return;
	} else {
		return data.result;
	}
};
