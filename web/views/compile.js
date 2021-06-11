import PageMain from './PageMain.svelte';

import Body from './Body.svelte';

if (document.querySelector('#page-main') != null) {
	new PageMain({
		target: document.querySelector('#page-main')
	});
}

if (document.querySelector('#remove-me') != null) {
	new Body({
		// change selector to 'body' element when old html is deleted
		target: document.querySelector('#remove-me')
	});
}