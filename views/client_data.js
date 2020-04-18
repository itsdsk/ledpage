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

socket.emit('load'); // request feed from server

socket.on("configuration", function (conf) {
    config.set(conf);
});

export const playbackStatus = writable({});

socket.on("nowplaying", function (playback) {
    // parse status object
    playbackStatus.set(JSON.parse(playback));
    // console.log(`recieved playback status:\n${JSON.stringify(JSON.parse(playback), null, 2)}`)
});

// var screenshotUpdatePeriod = 3000; // ms to update nowplaying
// function screenshotTimeout() {
//     setTimeout(function () {
//         // request screenshot
//         socket.emit('screenshot');
//         // recall parent to create recursive loop
//         screenshotTimeout();
//     }, screenshotUpdatePeriod);
// }
// screenshotTimeout()

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

export const channelObjects = writable([]);

socket.on("channellist", function (newChannelObjects) {
    // console.log(`got channel list: ${JSON.stringify(newChannelObjects)}`)
    channelObjects.set(newChannelObjects);
    sortMediaFeed();
});

export const mediaFeedObjects = writable([]);

// load complete array of media items
socket.on("mediafeed", function (newMediaFeedObjects) {
    mediaFeedObjects.set(newMediaFeedObjects);
});

// add individual media items
socket.on("addmediaitem", function (newMediaFeedObject) {
    mediaFeedObjects.update(mf => [newMediaFeedObject, ...mf]);
});

// update single media item in feed
socket.on("updatemediaitem", function (updatedMediaFeedObject) {
    mediaFeedObjects.update(mf => mf.map(item => {
        // return updated object
        if (item.directory == updatedMediaFeedObject.directory) {
            return updatedMediaFeedObject;
        }
        // return same object
        return item;
    }));
});

// delete media from client
socket.on("unloadmediaitem", function (mediaDirToDelete) {
    mediaFeedObjects.update(mf => mf.filter(item => item.directory !== mediaDirToDelete));
    console.log(`deleting media ${mediaDirToDelete} in store`);
});

export function sortMediaFeed(selectedSortMode = 'Recently added') {
    if (selectedSortMode === 'Most viewed') {
        // sort playcount high to low
        mediaFeedObjects.update(mf => mf.sort((a, b) => b.playcount - a.playcount));
    } else if (selectedSortMode === 'Recently added') {
        // sort date new to old
        mediaFeedObjects.update(mf => mf.sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified)));
    } else {
        console.log(`error in update sorting`);
    }
};