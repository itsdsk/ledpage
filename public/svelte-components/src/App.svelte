<script>
  import { onMount } from "svelte";

  import PlaybackStatus from "./PlaybackStatus.svelte";

  let time = Date.now();

  let fadeInTimeFromStart = 0;
  let fadeInDuration = 1;
  let autoplayTimeTillStart = 1;

  let playbackStatusTemplate = {
    title: false,
    directory: "",
    startTime: 0,
    fadeDuration: false
  };

  let nowPlaying = Object.assign({}, playbackStatusTemplate);
  let fadingPlaying = Object.assign({}, playbackStatusTemplate);
  let nxtPlaying = Object.assign({}, playbackStatusTemplate);

  onMount(() => {
    const interval = setInterval(() => {
      if (playbackState2 && playbackState2.playing) {
        time = Date.now();
        if (playbackState2.playingFadeIn) {
          fadeInTimeFromStart = Math.round(
            (time - playbackState2.playingFadeIn.startTime) / 1000
          );
          fadeInDuration = Math.round(
            playbackState2.playingFadeIn.fadeDuration / 1000
          );
          if (fadeInTimeFromStart >= fadeInDuration) {
            playbackState2.playing = playbackState2.playingFadeIn;
            playbackState2.playingFadeIn = false;
            fadeInTimeFromStart = 0;
            fadeInDuration = 1;
            nowPlaying = fadingPlaying;
            fadingPlaying = false;
          }
        }
        if (playbackState2.playingAutoNext) {
          autoplayTimeTillStart = Math.round(
            (playbackState2.playingAutoNext.startTime - time) / 1000
          );
          if (autoplayTimeTillStart <= 0) {
            playbackState2.playingFadeIn = playbackState2.playingAutoNext;
            playbackState2.playingAutoNext = false;
            fadingPlaying = nxtPlaying;
            nxtPlaying = false;
          }
        }
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  });
  let playbackState2 = {};

  socket.on("nowplaying2", function(playback) {
    // parse status object
    playbackState2 = JSON.parse(playback);

    if (playbackState2.playing) {
      nowPlaying = Object.assign(nowPlaying, {
        title: playbackState2.playing.metadata.title,
        directory: playbackState2.playing.directory,
        startTime: playbackState2.playing.startTime,
        fadeDuration: playbackState2.playing.fadeDuration
      });
    }
    if (playbackState2.playingFadeIn) {
      fadingPlaying = Object.assign(fadingPlaying, {
        title: playbackState2.playingFadeIn.metadata.title,
        directory: playbackState2.playingFadeIn.directory,
        startTime: playbackState2.playingFadeIn.startTime,
        fadeDuration: playbackState2.playingFadeIn.fadeDuration
      });
    }
    if (playbackState2.playingAutoNext) {
      nxtPlaying = Object.assign(nxtPlaying, {
        title: playbackState2.playingAutoNext.metadata.title,
        directory: playbackState2.playingAutoNext.directory,
        startTime: playbackState2.playingAutoNext.startTime,
        fadeDuration: playbackState2.playingAutoNext.fadeDuration
      });
    }
    console.log(`svelte received playback status from server`);
  });
</script>

now playing:
<PlaybackStatus {...nowPlaying} />

{#if fadingPlaying.title}
  fading:
  <PlaybackStatus {...fadingPlaying} />
{:else if nxtPlaying.title}
  next:
  <PlaybackStatus {...nxtPlaying} />
{/if}
