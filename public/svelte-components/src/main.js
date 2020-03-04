import PlaybackStatus from './PlaybackStatus.svelte';
import MediaFeed from './MediaFeed.svelte';
import Configuration from './Configuration.svelte';

new PlaybackStatus({
	target: document.querySelector('#playback-status')
});

new Configuration({
	target: document.querySelector('#configuration')
});

new MediaFeed({
	target: document.querySelector('#media-feed')
});