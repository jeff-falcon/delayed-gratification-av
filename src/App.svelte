<script lang="ts">
  import { onMount } from 'svelte'
  import * as PIXI from 'pixi.js'
  import { gsap } from 'gsap'
  import Play from './lib/Play.svelte'

  let music: HTMLAudioElement
  let isPlaying = false
  let bufferLength = 0
  let analyser: AnalyserNode
  let dataArray: Uint8Array
  let canvasEl: HTMLCanvasElement
  let xDistance = 250
  const bars = 128

  function initGraphics() {
    const app = new PIXI.Application({
      background: '#002',
      antialias: true,
      resolution: Math.min(2, window.devicePixelRatio),
      view: canvasEl,
      width: window.innerWidth,
      height: window.innerHeight,
    })
    const stageSize = {
      width: app.screen.width,
      height: app.screen.height,
    }
    window.addEventListener('resize', () => {
      stageSize.width = window.innerWidth
      stageSize.height = window.innerHeight
      app.view.width = window.innerWidth * window.devicePixelRatio
      app.view.height = window.innerHeight * window.devicePixelRatio
    })

    document.body.append(app.view as HTMLCanvasElement)
    const container = new PIXI.Container()
    let renderTexture = PIXI.RenderTexture.create(stageSize)
    let renderTexture2 = PIXI.RenderTexture.create(stageSize)
    const currentTexture = renderTexture

    const outputSprite = new PIXI.Sprite(currentTexture)
    outputSprite.width = stageSize.width
    outputSprite.height = stageSize.height
    outputSprite.anchor.set(0.5)
    app.stage.addChild(outputSprite)

    const left = new PIXI.Graphics()
    const right = new PIXI.Graphics()
    container.addChild(left)
    container.addChild(right)
    right.scale.x = -1

    app.stage.addChild(container)
    app.ticker.add(() => {
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray)
        xDistance = Math.random() < 0.03 ? 1500 : 250
        let forceFire = false
        let canFire = Math.random() < 0.7
        drawLines(left, right)
        for (let i = 0; i < bufferLength; i++) {
          const h = dataArray[i]
          const pct = h / 255

          if (i === Math.round(bufferLength * 0.55) && pct > 0.6) {
            xDistance = 1500
            forceFire = Math.random() < 0.65
            console.log('flash')
          }

          canFire = canFire && pct > 0.6 && Math.random() < 0.6
          if (canFire || forceFire) {
            createCircle(pct, stageSize.width, stageSize.height, container)
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
    })
  }
  function drawLines(left: PIXI.Graphics, right: PIXI.Graphics) {
    left.clear()
    right.clear()
    right.x = window.innerWidth
    const barHeight = window.innerHeight / (bars / 2)
    const barWidth = window.innerWidth / 1.5
    const lineHeight = 1
    for (let i = 0; i < bufferLength; i++) {
      const h = dataArray?.[i] ?? 0
      const pct = h / 255
      const vPct = i / bufferLength
      const color = { h: vPct * 145 + 160, s: vPct * 60 + 40, l: vPct * 60 + 25 }
      const offsetY = Math.round((barHeight - lineHeight) / 2)
      let y = Math.round(i * barHeight)
      const w = barWidth * pct
      const cp1_1 = {
        x: w * 0.25,
        y: y + 20,
      }
      const cp2_1 = {
        x: w * 0.5,
        y: y,
      }
      const cp1_2 = {
        x: w * 0.85,
        y: y - 30,
      }
      left.lineStyle(lineHeight, color)
      left.moveTo(0, y).quadraticCurveTo(cp1_1.x, cp1_1.y, cp2_1.x, cp2_1.y).quadraticCurveTo(cp1_2.x, cp1_2.y, w, y)
      left.drawCircle(w, y, 5)
      left.endFill()
      y += offsetY
      right.lineStyle(lineHeight, color)
      right.moveTo(0, y).quadraticCurveTo(cp1_1.x, cp1_1.y, cp2_1.x, cp2_1.y).quadraticCurveTo(cp1_2.x, cp1_2.y, w, y)
      right.drawCircle(w, y, 5)
      right.endFill()
    }
  }

  function createCircle(pct: number, width: number, height: number, container: PIXI.Container) {
    const g = new PIXI.Graphics()
    if (Math.random() < 0.6) {
      g.beginFill(`hsl(${Math.random() * 200 + 150}, ${(1 - Math.random()) * 60 + 40}%, ${Math.random() * 30 + 20}%)`)
    } else {
      g.lineStyle(
        Math.random() * 5 + 1,
        `hsl(${Math.random() * 200 + 150}, ${(1 - Math.random()) * 60 + 40}%, ${Math.random() * 30 + 20}%)`
      )
    }
    g.drawCircle(0, 0, Math.random() * 150 + 5)
    g.endFill()
    g.x = Math.random() * 200 - 100 + width / 2
    g.y = Math.random() * height
    g.alpha = Math.random() * 0.3 + 0.6
    g.blendMode = PIXI.BLEND_MODES.ADD
    //    g.filters = [new PIXI.BlurFilter(Math.random() * 15)]
    container.addChild(g)
    gsap.to(g, {
      alpha: 0,
      duration: 3,
      x: g.x + (Math.random() < 0.5 ? 1 : -1) * xDistance,
      ease: 'quad.in',
      onComplete: () => {
        container.removeChild(g)
      },
    })
    gsap.to(g, {
      alpha: 0,
      duration: 3,
      y: g.y + (Math.random() < 0.2 ? 1 : -1) * 400,
      ease: 'quint.in',
    })
    gsap.from(g.scale, {
      x: 0.65,
      y: 0.65,
      duration: 3,
      ease: 'expo.out',
    })
    return g
  }

  onMount(() => {
    initGraphics()
  })

  function play() {
    music.play()
    music.volume = 1
    isPlaying = true

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    let audioSource = null
    audioSource = audioCtx.createMediaElementSource(music)
    analyser = audioCtx.createAnalyser()
    audioSource.connect(analyser)
    analyser.connect(audioCtx.destination)
    analyser.fftSize = bars
    analyser.smoothingTimeConstant = 0.95

    bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)
  }
</script>

<main>
  <div class="wrap" class:isPlaying>
    <h1>j.Falcon</h1>
    <h2>Delayed Gratification</h2>
    <h3>Sep 1, 2023</h3>
    <audio id="audio" controls bind:this={music} src="/Delayed_Gratification_v4.m4a" />
    {#if !isPlaying}
      <button on:click={play}><Play /></button>
    {/if}
  </div>
  <canvas bind:this={canvasEl} width="100%" height="100%" />
</main>

<style>
  main {
    position: relative;
    height: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wrap {
    display: flex;
    flex-direction: column;
  }
  h1 {
    position: relative;
    z-index: 1;
    font-size: 10rem;
    margin: 0;
    line-height: 1;
    font-family: 'Zen Dots';
  }
  h2 {
    font-size: 3rem;
  }
  h3 {
    font-size: 1.25rem;
  }
  h1,
  h2,
  h3 {
    color: #002;
  }
  h2 {
    font-weight: 300;
    margin: 0;
  }
  h3 {
    font-weight: normal;
    margin: 0 0 60px;
    opacity: 0.75;
  }
  .isPlaying audio {
    display: block;
  }
  audio {
    position: relative;
    z-index: 1;
    margin: 0 auto;
    display: none;
  }
  canvas {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    z-index: 0;
  }
  button {
    margin: 0;
    background: transparent;
    color: #002;
    border: 0;
    overflow: hidden;
    border-radius: 64px;
    font-weight: bold;
    font-size: 18px;
    position: absolute;
    width: 128px;
    height: 128px;
    padding: 0;
    z-index: 10;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
