<script lang="ts">
	import App from '$lib/components/App.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<App currentTrack={data.track} />
