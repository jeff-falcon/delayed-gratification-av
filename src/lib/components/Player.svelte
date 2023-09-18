<script lang="ts">
	import { tracks } from '$lib/tracks';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { formatTime } from '$lib/store';

	let isPlaying = false;
	let audioEl: HTMLAudioElement | null = null;
	let audioFile = '';
	let time: number = 0;
	let duration: number = 0;

	$: timeFormatted = formatTime(time);
	$: durationFormatted = formatTime(duration);

	$: currentTrackId = $page.params.track;
	$: currentTrack = tracks.find((t) => t.id === currentTrackId);
	$: name = currentTrack?.name;

	function loadAudio() {
		duration = audioEl!.duration;
	}
	afterNavigate(() => {
		audioFile = currentTrack?.file ?? '';
	});
</script>

<div class="player">
	<h3>{name ?? 'Select...'}</h3>
	<audio
		bind:this={audioEl}
		src={audioFile}
		on:loadedmetadata={loadAudio}
		on:timeupdate={() => {
			if (audioEl) {
				time = audioEl.currentTime;
			}
		}}
		on:playing={() => {
			isPlaying = true;
		}}
		on:pause={() => {
			isPlaying = false;
		}}
		preload="metadata"
		mediagroup="tracks"
	/>
</div>

<style>
	.player {
		color: white;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 2;
		background: rgba(10, 7, 73, 0.58);
	}
</style>
