<script lang="ts">
	import type { Track, TrackAudio } from '$lib/types';

	import { createEventDispatcher, onMount } from 'svelte';
	import Play from './Play.svelte';
	import { analyser, audioContext, bars } from '$lib/store';
	import { getDatabase, ref, runTransaction } from '@firebase/database';
	import { trackEvent } from '$lib/firebase';

	export let track: Track;
	export let isPlaying = false;
	export let isSelected = false;

	let audioEl: HTMLAudioElement | null = null;
	let audioSource: MediaElementAudioSourceNode | null = null;

	let time: number = 0;
	let duration: number = 0;
	let scrubPct = 0;
	let isScrubbing = false;
	let trackEl: HTMLElement;
	let didPlay = false;

	$: timeFormatted = formatTime(Math.max(0, isScrubbing ? (scrubPct / 100) * duration : time));
	$: durationFormatted = formatTime(duration);
	$: playheadPct = duration ? (100 * time) / duration : 0;

	function formatTime(seconds: number) {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
	}

	function updatePlayCount(completed = false) {
		const db = getDatabase();
		const trackRef = ref(db, `tracks/${track.id}/${completed ? 'completedPlays' : 'plays'}`);
		runTransaction(trackRef, (plays) => {
			if (plays) {
				return plays + 1;
			} else {
				return 1;
			}
		});
		if (!completed) {
			trackEvent(`play-${track.id}`);
			trackEvent(`play`, { label: track.name });
		} else {
			trackEvent(`complete-${track.id}`);
			trackEvent(`complete`, { label: track.name });
		}
	}

	let audioFile = '';

	const dispatch = createEventDispatcher<{ play: TrackAudio; end: void }>();

	onMount(() => {
		audioFile = track.file;
		audioEl?.addEventListener('ended', () => {
			dispatch('end');
			updatePlayCount(true);
			setTimeout(() => {
				didPlay = false;
			}, 100);
		});
	});

	function startPlaying() {
		// start player now
		if (!$audioContext) {
			const ctx = new (window.AudioContext || window.webkitAudioContext)();
			audioContext.set(ctx);
			const a = $audioContext!.createAnalyser();
			a.fftSize = bars;
			a.smoothingTimeConstant = 0.95;
			analyser.set(a);
		}

		if (!audioSource && $audioContext && audioEl) {
			if (
				!navigator.userAgent.includes('Mobile/15E148 Safari/604.1') &&
				!navigator.userAgent.includes('iPhone OS 17_0')
			) {
				console.log('audioSource created');
				audioSource = $audioContext.createMediaElementSource(audioEl);
			}
		}
		if (audioEl) {
			if (!isPlaying) {
				dispatch('play', { audioEl, audioSource });
			} else {
				audioEl.pause();
			}
		}
		if (!didPlay) {
			updatePlayCount();
		}
		didPlay = true;
	}

	function loadAudio() {
		duration = audioEl!.duration;
	}

	function startScrub() {
		isScrubbing = true;
		trackEl.removeEventListener('mousemove', onScrub);
		trackEl.addEventListener('mousemove', onScrub);
	}
	function endScrub() {
		isScrubbing = false;
		trackEl.removeEventListener('mousemove', onScrub);
	}
	function onScrub(e: MouseEvent) {
		if (trackEl) {
			const r = trackEl.getBoundingClientRect();
			const w = r.width;
			const x = e.clientX - r.left;
			const pct = (100 * x) / w;
			scrubPct = (pct / 100) * duration < 10 ? 0 : pct;
		}
	}
	function jumpToPosition(e: MouseEvent) {
		if (audioEl) {
			const t = (scrubPct / 100) * duration;
			audioEl.currentTime = t;
			trackEvent(`seek`, { label: track.name, time: Math.round(t) });
		}
	}
</script>

<div
	class="track"
	id="track-{track.id}"
	class:isPlaying
	class:isSelected
	class:didPlay
	class:isScrubbing
>
	<button on:click={startPlaying}>
		<div class="play-icon">
			<Play {isPlaying} />
		</div>
		<h3 class="name">{track.name}</h3>
		<div class="time">
			{#if didPlay && isSelected}
				<span class="current">{timeFormatted}</span>
				<span class="divider" />
			{/if}<span class="duration">{durationFormatted}</span>
		</div>
		<audio
			controls
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
		/>
	</button>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		bind:this={trackEl}
		class="scrub"
		on:click={jumpToPosition}
		on:mouseenter={startScrub}
		on:mouseleave={endScrub}
	>
		<div class="playhead" style="left: {isScrubbing ? scrubPct : playheadPct}%" />
		<div class="playfill" style="width: {playheadPct}%" />
	</div>
</div>

<style>
	.track {
		color: white;
		font-family: 'Share Tech Mono', monospace;
		box-shadow: inset 0 0 1px 1px rgba(255, 255, 255, 0.15);
		border-radius: 180px;
		padding: 0 16px 0 4px;
		background: rgba(0, 0, 0, 0.5);
		-webkit-backdrop-filter: blur(6px);
		backdrop-filter: blur(6px);
		overflow: hidden;
		position: relative;
	}
	.track.isSelected {
		box-shadow: inset 0 0 1px 1px white;
	}
	.track.isSelected .play-icon {
		opacity: 1;
	}
	.track:not(.isSelected):not(.isPlaying) .play-icon :global(.circle) {
		opacity: 0;
	}
	button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-decoration: none;
		color: inherit;
		font-family: inherit;
		gap: 8px;
		padding: 0;
		margin: 0;
		background: transparent;
		border: 0;
		border-radius: 0;
		width: 100%;
		text-align: left;
		z-index: 10;
		outline: none;
	}
	button * {
		pointer-events: none;
	}
	button:focus-visible {
		color: rgb(225, 228, 65);
	}
	.didPlay button {
		z-index: 1;
	}
	.playhead {
		width: 1px;
		background: transparent;
		top: 0;
		bottom: 0;
		position: absolute;
	}
	.playfill {
		background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%);
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
	}
	.isScrubbing .playhead {
		background-color: rgba(255, 255, 255, 0.6);
	}
	.scrub {
		position: absolute;
		left: 56px;
		top: 2px;
		right: 2px;
		bottom: 2px;
		z-index: 2;
		cursor: ew-resize;
		border-radius: 0 180px 180px 0;
		overflow: hidden;
		visibility: hidden;
	}
	.didPlay.isSelected .scrub {
		visibility: visible;
	}
	.name {
		flex: 1;
		line-height: 1;
		font-family: 'Assistant';
		font-size: 14px;
		font-weight: normal;
		line-height: 26px;
	}
	.play-icon {
		width: 48px;
		height: 48px;
		border-radius: 80px;
		overflow: hidden;
		opacity: 0.5;
	}
	audio {
		position: absolute;
		display: none;
	}
	.time {
		font-family: 'Share Tech Mono', monospace;
		line-height: 1;
		font-size: 12px;
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.time .divider {
		display: inline-block;
		height: 20px;
		width: 1px;
		background: white;
	}
	.isPlaying .time .current ~ .duration,
	.isPlaying .time .current ~ .divider {
		display: none;
	}
	.isPlaying.isScrubbing .time .divider,
	.isPlaying.isScrubbing .time .duration {
		opacity: 0.5;
		display: inline-block;
	}
	@media (min-width: 560px) {
		.time {
			font-size: 14px;
		}
		.name {
			font-size: 18px;
			line-height: 1;
		}
	}
</style>
