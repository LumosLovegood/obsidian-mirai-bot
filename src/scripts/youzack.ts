import { exec } from 'child_process';
import { downloadBufferItem, fileExtByContent } from 'src/utils';

export async function getYouzack(imageFolder: string, index: number) {
	const url = `https://static3.youzack.com/ielts/speech/BBC100/${index.toString().padStart(2, '0')}.m4a`;
	const data = await downloadBufferItem(url);
	const fileExt = await fileExtByContent(data);
	const fileName = 'youzack' + window.moment().format('YYYYMMDDHHmmss');
	const filePath = imageFolder + '/' + fileName;
	//@ts-ignore
	const basePath = app.vault.adapter.basePath;
	const botFolder = basePath + '/' + app.vault.configDir + '/mirai-bot';
	const pcmPath = botFolder + '/' + fileName + '.pcm';
	const slkPath = botFolder + '/' + fileName + '.slk';
	const pyPath = botFolder + '/any2slk.py';
	const mp3Path = basePath + '/' + filePath;
	const cmdStr = `pwsh.exe -c python ${pyPath} ${mp3Path + '.' + fileExt} ${pcmPath} ${slkPath}`;
	await app.vault.createBinary(filePath + '.' + fileExt, data).then(() => {
		exec(cmdStr);
	});
	return slkPath;
}
