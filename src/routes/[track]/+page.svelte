<script lang="ts">
	import App from '$lib/components/App.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: trackName = data.track?.name.length ? `${data.track.name} | ` : '';
</script>

<svelte:head>
	<title>"{trackName}"j.Falcon | "Undefined"</title>
</svelte:head>

<App currentTrack={data.track} />
