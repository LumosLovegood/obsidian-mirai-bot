<script lang="ts">
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
	export let vaultName: string;
	export let activities: {
		time: string;
		brief: string;
		info: string;
		icon: string;
		location: string;
		musicUrl: string;
		imgUrlList: string[];
		sourceUrlList: string[];
		internalLink: string;
	}[];
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
				<span class="brief">
					{activity.brief}
					{#if activity.internalLink != ''}
						<a href="obsidian://advanced-uri?vault={encodeURI(vaultName)}&filename={encodeURI(activity.internalLink)}&newpane=true"
							class="internal-link">
							{activity.internalLink}
						</a>
					{/if}
				</span>
				{#each activity.imgUrlList as imgUrl}
					{#each activity.sourceUrlList as sourceUrl}
					<div class='img-wrapper'>
						<a href={'obsidian://web-open?url=' + encodeURIComponent(sourceUrl)}>
						<!-- <a href={sourceUrl}> -->
							<img src={imgUrl} alt={imgUrl} class="img-cover" />
						</a>
					</div>
					{/each}
				{/each}
				{#if activity.musicUrl != ''}
					<br /><iframe src={activity.musicUrl} title="Music Share" height="100" class="iframe-music" />
				{/if}
				{#if activity.info != ''}
					<div class="info-block">
						{@html activity.info}
					</div>
				{/if}
			</TimelineContent>
		</TimelineItem>
	{/each}
</Timeline>
<style>
	.brief {
		font-size: 1.5rem;
		font-weight: 500;
		font-family: '华文新魏';
		word-break: break-all;
	}
	.iframe-music {
		margin: 10px;
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
		max-width: 400px;
		background-color: #fff1ac;
		color: #000;
		user-select: text;
		text-align: start;
		word-break: break-all;
		margin: auto;
	}
	.img-wrapper {
		width: 70%;
		min-width: 100px;
		height: 0;
		padding-bottom: 30%;
		position: relative;
		margin: auto;
	}
	.img-cover {
		position: absolute;
		margin: 10px;
		object-fit: cover;
		width: 100%;
		height: 100%;
		border-radius: 15px;
		box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.46), 0 2px 12px 0 rgba(0, 0, 0, 0.12),
			0 4px 5px -3px rgba(0, 0, 0, 0.2);
	}

	.internal-link {
		text-decoration-line: none;
	}
	.time {
		font-family: 'SentyZHAO 新蒂赵孟頫';
		font-size: 1.5rem;
		font-weight: 700;
		color: aqua;
	}
</style>
