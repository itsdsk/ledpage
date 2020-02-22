import PlaybackStatus from './PlaybackStatus.svelte';
import MediaFeed from './MediaFeed.svelte';

new PlaybackStatus({
	target: document.querySelector('#playback-status')
});

new MediaFeed({
	target: document.querySelector('#media-feed')
});