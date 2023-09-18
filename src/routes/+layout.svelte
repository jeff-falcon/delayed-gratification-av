<script lang="ts">
	import { onMount } from 'svelte';
	import './app.css';
	import { ga } from '$lib/store';
	import { initializeApp } from '@firebase/app';
	import { getAnalytics, logEvent } from '@firebase/analytics';
	import { firebaseConfig, trackEvent } from '$lib/firebase';

	const app = initializeApp(firebaseConfig);

	onMount(() => {
		const analytics = getAnalytics(app);
		ga.set(analytics);
		trackEvent('page_view');
	});
</script>

<main>
	<slot />
</main>

<style>
	main {
		position: relative;
		height: 100vh;
		height: 100svh;
		width: 100vw;
		overflow: hidden;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
