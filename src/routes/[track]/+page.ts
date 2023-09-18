import { tracks } from '$lib/tracks'
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const track = tracks.find((track) => track.id === params.track);
  if (track) {
    error(404, 'Track not found')
  }
  return {
    track
  }
}