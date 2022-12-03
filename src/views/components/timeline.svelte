<script lang="ts">
	import type { TFile } from 'obsidian';
	import type { ActivityRecord } from 'src/type';

	import {
		Timeline,
		TimelineItem,
		TimelineSeparator,
		TimelineDot,
		TimelineConnector,
		TimelineContent,
		TimelineOppositeContent,
	} from 'svelte-vertical-timeline';
	// import store from 'src/store';
	// import type MiraiBot from '../main'
	// let plugin: MiraiBot;
	// store.plugin.subscribe((p) => (plugin = p));
	export let activities: ActivityRecord[];

	let ctrlDown: boolean;
	document.onkeydown = function(e) {
		if (e.ctrlKey) ctrlDown = true;
	}
	document.onkeyup = function(e) {
		if (e.key==='Control') ctrlDown = false;
	}
	$: popover = function(event:any){
		const hoverEditor = app.plugins.plugins["obsidian-hover-editor"];
		const filePath = event.target.innerText.trim();
		console.log('🚀 ~ filePath', filePath);
		const tfile = app.metadataCache.getFirstLinkpathDest(filePath, '');
		console.log(tfile);
		if (!ctrlDown) return;
		setTimeout(() => {
			const leaf = hoverEditor.spawnPopover(undefined, () => {
				app.workspace.setActiveLeaf(leaf,{focus:true});
			});
			leaf.openFile(tfile as TFile);
		},500)
	}
</script>

<Timeline position="alternate">
	{#each activities as activity}
		<TimelineItem>
			<TimelineOppositeContent slot="opposite-content">
				<span class="time">{activity.time}</span>
			</TimelineOppositeContent>
			<TimelineSeparator>
				<TimelineDot style={'background-color: #FEC048; width:20px; height:20px'} />
				<TimelineConnector style="width:3px;border-radius:3px" />
			</TimelineSeparator>
			<TimelineContent>
				<div class="brief">
					{activity.category}: 					<!-- svelte-ignore a11y-mouse-events-have-key-events -->
					<a on:mouseover={popover} href={activity.briefLink} style="text-decoration-line: none;color:#8bc24c;">
						{activity.brief}
					</a>
				</div>
				{#each activity.details as {type, content}}
				{#if type === 'image'}
					<div class='img-wrapper'>
						<a href={'obsidian://web-open?url=' + encodeURIComponent(content)}>
							<img src={content} alt={content} class="img-cover" />
						</a>
					</div>
				{:else if type === 'audio'}
					<div class="iframe-music">
						<audio controls src={content} class="height:100%"></audio>
					</div>
				{:else if type === 'iframe'}
					<br /><iframe src={content} title="Music Share" height="100" class="iframe-music" />
				{:else}
					<div class="info-block">
						{@html content}
					</div>
				{/if}
			{/each}
			</TimelineContent>
		</TimelineItem>
	{/each}
</Timeline>
<style>
	.brief {
		font-size: 1.5rem;
		font-weight: 500;
		font-family: '华文新魏';
		word-wrap: break-word;
		word-break: break-all;
		overflow: hidden;
	}
	.iframe-music {
		margin: auto;
		margin-bottom: 10px;
		margin-top: 10px;
		border-radius: 15px;
		box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.46), 0 2px 12px 0 rgba(0, 0, 0, 0.12),
			0 4px 5px -3px rgba(0, 0, 0, 0.2);
	}
	.info-block {
		border-radius: 5px 5px 15px 5px;
		box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.46), 0 2px 12px 0 rgba(0, 0, 0, 0.12),
			0 4px 5px -3px rgba(0, 0, 0, 0.2);
		padding: 5px 10px 5px 10px;
		font-size: 1.2rem;
		width: 70%;
		background-color: #fff1ac;
		color: #000;
		user-select: text;
		text-align: start;
		word-break: normal;
		overflow: hidden;
		margin: auto;
		margin-bottom: 10px;
		margin-top: 10px;
	}
	.img-wrapper {
		width: 70%;
		min-width: 100px;
		height: 0;
		padding-bottom: 40%;
		position: relative;
		margin: auto;
		margin-bottom: 10px;
		margin-top: 10px;
	}
	.img-cover {
		position: absolute;
		object-fit: cover;
		width: 100%;
		height: 100%;
		border-radius: 15px;
		box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.46), 0 2px 12px 0 rgba(0, 0, 0, 0.12),
			0 4px 5px -3px rgba(0, 0, 0, 0.2);
	}
	.time {
		font-family: 'SentyZHAO 新蒂赵孟頫';
		font-size: 1.5rem;
		font-weight: 700;
		color: #fff;
		background-color: #41b6e6;
		padding: 3px;
		border-radius: 10px;
	}
</style>
