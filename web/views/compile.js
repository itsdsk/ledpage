import PageMain from './PageMain.svelte';

import Body from './Body.svelte';

import Setup from './Setup.svelte';

if (window.location.pathname.includes('setup')) {
	new Setup({
		target: document.querySelector('body')
	});
} else if (window.location.pathname.includes('old')) {
	new PageMain({
		target: document.querySelector('#page-main')
	});
} else {
	new Body({
		target: document.querySelector('body')
	});
}