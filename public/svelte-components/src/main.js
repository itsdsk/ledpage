import PageMain from './PageMain.svelte';
import MediaFeed from './MediaFeed.svelte';

new PageMain({
	target: document.querySelector('#page-main')
});

new MediaFeed({
	target: document.querySelector('#media-feed')
});