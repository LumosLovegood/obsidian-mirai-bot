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

<center
	><h2 style="font-family:'SentyZHAO 新蒂赵孟頫';font-weight:500;font-size:xx-large;color:#fff1ac">
		今 日 时 间 线
	</h2></center
>
<hr />
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
						<a
							href="obsidian://open?vault={encodeURI(vaultName)}&file={encodeURI(activity.internalLink)}"
							class="internal-link">{activity.internalLink}</a
						>
					{/if}
				</span>
				{#each activity.imgUrlList as imgUrl}
					{#each activity.sourceUrlList as sourceUrl}
						<a href={sourceUrl}>
							<img src={imgUrl} alt={imgUrl} class="img-cover" />
						</a>
					{/each}
				{/each}
				{#if activity.musicUrl != ''}
					<br /><iframe src={activity.musicUrl} title="Music Share" height="100" class="iframe-music" />
				{/if}
				{#if activity.info != ''}
					<blockquote class="info-block">
						{@html activity.info}
					</blockquote>
				{/if}
			</TimelineContent>
		</TimelineItem>
	{/each}
</Timeline>

<style>
	.brief {
		font-size: x-large;
		font-weight: 500;
		font-family: '华文新魏';
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
		font-size: large;
		width: 90%;
		background-color: #fff1ac;
		color: #000;
		user-select: text;
		text-align: start;
	}
	.img-cover {
		position: relative;
		margin: 10px;
		object-fit: cover;
		width: 280px;
		height: 180px;
		border-radius: 15px;
		box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.46), 0 2px 12px 0 rgba(0, 0, 0, 0.12),
			0 4px 5px -3px rgba(0, 0, 0, 0.2);
	}

	.internal-link {
		text-decoration-line: none;
		color: aqua;
	}
	.time {
		font-family: 'SentyZHAO 新蒂赵孟頫';
		font-size: x-large;
		font-weight: 700;
		color: aqua;
	}
</style>
