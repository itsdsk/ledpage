import PageMain from './PageMain.svelte';

import Body from './Body.svelte';

if (!window.location.pathname.includes('nxt') && document.querySelector('#page-main') != null) {
	new PageMain({
		target: document.querySelector('#page-main')
	});
}

if (window.location.pathname.includes('nxt')) {
	new Body({
		target: document.querySelector('body')
	});
}