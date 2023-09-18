<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import * as PIXI from 'pixi.js';
	import { gsap } from 'gsap';
	import type { Track, TrackAudio } from '$lib/types';
	import TrackComponent from '$lib/components/Track.svelte';
	import { tracks } from '$lib/tracks';
	import { audioContext, bars, analyser } from '$lib/store';

	export let currentTrack: Track | null = null;

	let music: HTMLAudioElement | null = null;
	let audioSource: MediaElementAudioSourceNode | null = null;
	let bufferLength = 0;
	let dataArray: Uint8Array;
	let canvasEl: HTMLCanvasElement;
	let xDistance = 250;
	let innerWidth = typeof window === 'undefined' ? 393 : window.innerWidth;
	let innerHeight = typeof window === 'undefined' ? 660 : window.innerHeight;

	$: isMobile = innerWidth < 560;

	function getResolution() {
		const devicePixelRatio = typeof window === 'undefined' ? 2 : window.devicePixelRatio;
		return Math.min(2, devicePixelRatio);
	}

	function getCanvasSize() {
		const main = document.querySelector('main');
		const size = {
			width: main?.clientWidth ?? window.innerWidth,
			height: main?.clientHeight ?? window.innerHeight
		};
		return size;
	}

	function initGraphics() {
		const app = new PIXI.Application({
			background: '#002',
			antialias: true,
			resolution: getResolution(),
			view: canvasEl,
			width: getCanvasSize().width,
			height: getCanvasSize().height
		});
		const stageSize = {
			width: app.screen.width,
			height: app.screen.height
		};
		window.addEventListener('resize', () => {
			const { width, height } = getCanvasSize();
			stageSize.width = width;
			stageSize.height = height;
			app.view.width = width * getResolution();
			app.view.height = height * getResolution();
		});

		document.body.append(app.view as HTMLCanvasElement);
		const container = new PIXI.Container();
		let renderTexture = PIXI.RenderTexture.create(stageSize);
		let renderTexture2 = PIXI.RenderTexture.create(stageSize);
		const currentTexture = renderTexture;

		const outputSprite = new PIXI.Sprite(currentTexture);
		outputSprite.width = stageSize.width;
		outputSprite.height = stageSize.height;
		outputSprite.anchor.set(0.5);
		app.stage.addChild(outputSprite);

		const left = new PIXI.Graphics();
		const right = new PIXI.Graphics();
		container.addChild(left);
		container.addChild(right);
		right.scale.x = -1;

		app.stage.addChild(container);
		app.ticker.add(() => {
			if ($analyser && dataArray) {
				$analyser.getByteFrequencyData(dataArray);
				xDistance = Math.random() < 0.03 ? 1500 : 250;
				let forceFire = false;
				let canFire = Math.random() < 0.7;
				drawLines(left, right);
				for (let i = 0; i < bufferLength; i++) {
					const h = dataArray[i];
					const pct = h / 255;

					if (i === Math.round(bufferLength * 0.55) && pct > 0.6) {
						xDistance = 1500;
						forceFire = Math.random() < 0.65;
					}

					canFire = canFire && pct > 0.6 && Math.random() < 0.6;
					if (canFire || forceFire) {
						createCircle(pct, stageSize.width, stageSize.height, container);
					}
				}
			}

			/* const temp = renderTexture
      renderTexture = renderTexture2
      renderTexture2 = temp

      // set the new texture
      outputSprite.texture = renderTexture
      app.renderer.render(app.stage, {
        renderTexture: renderTexture2,
        clear: false,
      }) */
		});
	}
	function drawLines(left: PIXI.Graphics, right: PIXI.Graphics) {
		left.clear();
		right.clear();
		right.x = innerWidth;
		const hue = currentTrack?.hue ?? 150;
		const barHeight = innerHeight / (bars / 2);
		const barWidth = innerWidth / 1.5;
		const lineHeight = 1;
		for (let i = 0; i < bufferLength; i++) {
			const h = dataArray?.[i] ?? 0;
			const pct = h / 255;
			const vPct = i / bufferLength;
			const color = { h: vPct * hue + hue, s: vPct * 60 + 40, l: vPct * 60 + 25 };
			const offsetY = Math.round((barHeight - lineHeight) / 2);
			let y = Math.round(i * barHeight);
			const w = barWidth * pct;
			left.lineStyle(lineHeight, color);
			left.moveTo(0, y).lineTo(w, y);
			left.lineStyle(lineHeight, { ...color, a: pct });
			left.beginFill({ ...color, a: pct });
			left.drawCircle(w, y, 3);
			left.endFill();
			y += offsetY;
			right.lineStyle(lineHeight, { ...color, a: pct });
			right.beginFill({ ...color, a: pct });
			right.moveTo(0, y).lineTo(w, y);
			right.drawCircle(w, y, 3);
			right.endFill();
		}
	}

	function createCircle(pct: number, width: number, height: number, container: PIXI.Container) {
		const g = new PIXI.Graphics();
		const hue = currentTrack?.hue ?? 150;
		if (Math.random() < 0.2) {
			g.beginFill(
				`hsl(${Math.random() * hue * 1.2 + hue}, ${(1 - Math.random()) * 60 + 40}%, ${
					Math.random() * 30 + 20
				}%)`
			);
		} else {
			g.lineStyle(
				Math.random() * 2 + 1,
				`hsl(${Math.random() * hue * 1.2 + hue}, ${(1 - Math.random()) * 60 + 40}%, ${
					Math.random() * 30 + 20
				}%)`
			);
		}
		g.drawCircle(0, 0, Math.random() * (isMobile ? 60 : 150) + 5);
		g.endFill();
		const offsetX = isMobile ? 200 : 50;
		g.x = Math.random() * offsetX - offsetX * 0.5 + width / 2;
		g.y = Math.random() * height;
		g.alpha = Math.random() * 0.3 + 0.6;
		g.blendMode = PIXI.BLEND_MODES.ADD;
		//    g.filters = [new PIXI.BlurFilter(Math.random() * 15)]
		container.addChild(g);
		gsap.to(g, {
			alpha: 0,
			duration: 3,
			x: g.x + (Math.random() < 0.5 ? 1 : -1) * xDistance,
			ease: 'quad.in',
			onComplete: () => {
				container.removeChild(g);
			}
		});
		gsap.to(g, {
			alpha: 0,
			duration: 3,
			y: g.y + (Math.random() < 0.2 ? 1 : -1) * 400,
			ease: 'quint.in'
		});
		gsap.from(g.scale, {
			x: 0.65,
			y: 0.65,
			duration: 3,
			ease: 'expo.out'
		});
		return g;
	}

	onMount(() => {
		setTimeout(() => {
			initGraphics();
		}, 100);
	});

	function play() {
		if (music) {
			music.play();
			music.volume = 1;

			if (audioSource && $audioContext && $analyser) {
				audioSource.connect($analyser);
				$analyser.connect($audioContext.destination);

				bufferLength = $analyser.frequencyBinCount;
				dataArray = new Uint8Array(bufferLength);
			}
		} else {
			console.log('no music');
		}
	}
	function onPlayTrack(audio: TrackAudio, track: Track) {
		currentTrack = track;
		music?.pause();
		music = audio.audioEl;
		//audioSource = audio.audioSource;
		for (const t of tracks) {
			if (t === track) t.isPlaying = true;
			else t.isPlaying = false;
		}
		play();
	}

	function skipToNextTrack() {
		const index = tracks.findIndex((t) => t === currentTrack);
		const next = (index + 1) % tracks.length;
		const track = document.querySelector('#track-' + tracks[next].id + ' button');
		if (track) {
			(track as HTMLButtonElement).click();
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="wrap">
	<div class="text">
		<h1>j.Falcon</h1>
		<h2>Undefined</h2>
	</div>
	<div class="list">
		{#each tracks as track (track.id)}
			<TrackComponent
				{track}
				isSelected={track === currentTrack}
				on:play={(e) => {
					onPlayTrack(e.detail, track);
				}}
				on:end={() => {
					skipToNextTrack();
				}}
			/>
		{/each}
	</div>
</div>
<canvas bind:this={canvasEl} width="100%" height="100%" />

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 1;
	}
	.list {
		max-width: 440px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	h1 {
		position: relative;
		z-index: 1;
		font-size: 4rem;
		margin: 0;
		line-height: 1;
		font-family: 'Zen Dots';
		text-align: center;
	}
	h2 {
		font-size: 1.5rem;
		font-family: 'Zen Dots';
		width: 320px;
		margin: 0 auto;
		font-weight: 300;
		text-align: right;
		transform: translate(-4%, -30%);
	}
	/* h3 {
		font-size: 1rem;
		font-weight: normal;
		margin: 0 0 60px;
		opacity: 0.75;
	} */
	h1,
	h2 {
		text-shadow: 0 3px 15px rgba(0, 0, 0, 0.5);
	}
	.text {
		color: white;
	}
	@media (min-width: 560px) {
		h1 {
			font-size: 7rem;
		}
		h2 {
			font-size: 3rem;
			transform: translate(-2px, -40%);
			width: 100%;
		}
		/* h3 {
			font-size: 1.25rem;
		} */
	}
	@media (min-width: 900px) {
		h1 {
			font-size: 10rem;
		}
		h2 {
			transform: translate(-5px, -50%);
		}
	}

	canvas {
		position: fixed;
		height: 100vh;
		width: 100%;
		top: 0;
		left: 0;
		z-index: 0;
	}
</style>
