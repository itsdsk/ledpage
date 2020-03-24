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
    // console.log(`recieved playback status:\n${JSON.stringify(JSON.parse(playback), null, 2)}`)
});

export const time = readable(Date.now(), function start(set) {
    const interval = setInterval(() => {
        set(Date.now());
    }, 1000);

    return function stop() {
        clearInterval(interval);
    };
});

export const livePlaybackStatus = derived([playbackStatus, time], ([$playbackStatus, $time], set) => {
    //
    let nowPlaying = false;
    let nextPlaying = false;
    if ($playbackStatus.playingFadeIn) {
        // get time from start for playing fade in object
        let fadeInTimeFromStart = $time - $playbackStatus.playingFadeIn.startTime;
        // check if playingFadeIn has finished fading in
        if (fadeInTimeFromStart > $playbackStatus.playingFadeIn.fadeDuration) {
            // set playingFadeIn object as nowPlaying as it has actually finished fading in
            nowPlaying = $playbackStatus.playingFadeIn;
            //
            if ($playbackStatus.playingAutoNext) {
                let autoNextTimeFromStart = $time - $playbackStatus.playingAutoNext.startTime;
                nextPlaying = $playbackStatus.playingAutoNext;
                nextPlaying.timeFromStart = autoNextTimeFromStart;
            }
        } else {
            // set nowPlaying and playing fade in
            nowPlaying = $playbackStatus.playing;
            nextPlaying = $playbackStatus.playingFadeIn;
            nextPlaying.timeFromStart = fadeInTimeFromStart; // add time from start
        }
    } else {
        // set nowPlaying
        nowPlaying = $playbackStatus.playing;
        // set nextPlaying
        if ($playbackStatus.playingAutoNext) {
            let autoNextTimeFromStart = $time - $playbackStatus.playingAutoNext.startTime;
            nextPlaying = $playbackStatus.playingAutoNext;
            nextPlaying.timeFromStart = autoNextTimeFromStart;
        }
    }
    // clear time from start
    if (nowPlaying)
        delete nowPlaying.timeFromStart;

    // set the final playback status
    set({
        'nowPlaying': nowPlaying,
        'nextPlaying': nextPlaying
    });
}, {});