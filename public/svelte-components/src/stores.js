import {
    readable,
    writable,
    derived
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

export const playbackStatus = writable({});

socket.on("nowplaying", function (playback) {
    // parse status object
    playbackStatus.set(JSON.parse(playback));
});

export const time = readable(Date.now(), function start(set) {
    const interval = setInterval(() => {
        set(Date.now());
    }, 1000);

    return function stop() {
        clearInterval(interval);
    };
});

export const playingFadeInTimeFromStart = derived([time, playbackStatus], ([$time, $playbackStatus], set) => {
    if ($playbackStatus.playingFadeIn) {
        set(Math.round($time - $playbackStatus.playingFadeIn.startTime));
    } else {
        set(null);
    }
}, null);

export const playingAutoNextTimeFromStart = derived([time, playbackStatus], ([$time, $playbackStatus], set) => {
    if ($playbackStatus.playingAutoNext) {
        set(Math.round($time - $playbackStatus.playingAutoNext.startTime));
    } else {
        set(null);
    }
}, null);

export const nowPlaying = derived([playingFadeInTimeFromStart, playbackStatus], ([$playingFadeInTimeFromStart, $playbackStatus], set) => {
    if ($playbackStatus.playingFadeIn && $playingFadeInTimeFromStart > $playbackStatus.playingFadeIn.fadeDuration) {
        set($playbackStatus.playingFadeIn);
    } else {
        set($playbackStatus.playing);
    }
});

export const fadingPlaying = derived([playingAutoNextTimeFromStart, playbackStatus], ([$playingAutoNextTimeFromStart, $playbackStatus], set) => {
    if ($playingAutoNextTimeFromStart >= 0) {
        set($playbackStatus.playingAutoNext);
    } else {
        set($playbackStatus.playingFadeIn);
    }
});

export const nxtPlaying = derived([playingAutoNextTimeFromStart, playbackStatus], ([$playingAutoNextTimeFromStart, $playbackStatus], set) => {
    if ($playingAutoNextTimeFromStart >= 0) {
        set(false);
    } else {
        set($playbackStatus.playingAutoNext);
    }
});