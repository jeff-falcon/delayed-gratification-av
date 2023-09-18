import { writable } from 'svelte/store';
import type { Analytics } from '@firebase/analytics'

export const currentAudio = writable<HTMLAudioElement | null>(null);
export const audioContext = writable<AudioContext | null>(null);
export const analyser = writable<AnalyserNode | null>(null);
export const bars = 128;

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export const ga = writable<Analytics | null>(null)