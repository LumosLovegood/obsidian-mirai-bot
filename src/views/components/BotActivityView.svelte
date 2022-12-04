<script lang="ts">
    import type MiraiBot from 'src/main';
	import type { ActivityRecord, MiraiBotSettings } from 'src/type';
	import { getActivities, getHeatmapData } from '../data/dataSource';
	import { onMount } from 'svelte';
    import ActivityTimeline from './timeline.svelte';
	import Heatmap from './heatmap.svelte';
	export let settings: MiraiBotSettings;
	export let plugin: MiraiBot;
	let activities: ActivityRecord[] = [];
	let heatmapData: {date: string, value: number}[] = [];
	let date = window.moment().format('YYYY年M月D日')
	const vaultName = app.vault.getName();
	$:dateUrl = `obsidian://advanced-uri?vault=${vaultName}&filename=${encodeURI(date)}&openmode=true`
	onMount(async() => {
		activities = await getActivities(settings);
		// activities = await getActivities(settings);
		heatmapData = getHeatmapData();
	})
	plugin.registerEvent(app.vault.on('modify', async () => {
		activities = await getActivities(settings);
	}))
</script>
<Heatmap data={heatmapData}/>
<h1 style="text-align: center">📅<a href={dateUrl}>{date}</a></h1>
<ActivityTimeline activities = {activities}/>