import {
    writable
} from 'svelte/store';

export const config = writable({
    'settings': {
        'autoplayDuration': {}
    },
    'outputs': []
});

socket.on("configuration", function (conf) {
    config.set(conf);
});