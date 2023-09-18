<script lang="ts">
	import { onMount } from 'svelte';
	import './app.css';
	import { audioContext, analyser, bars } from '$lib/store';

	/* onMount(() => {
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		audioContext.set(ctx);
		const a = $audioContext!.createAnalyser();
		a.fftSize = bars;
		a.smoothingTimeConstant = 0.95;
		analyser.set(a);
	}); */
</script>

<svelte:head>
	<meta name="description" content="Original music from Jeff Falcon" />
</svelte:head>

<main>
	<slot />
</main>

<style>
	main {
		position: relative;
		height: 100%;
		width: 100vw;
		overflow: hidden;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
