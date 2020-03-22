<script>
  import { onMount } from "svelte";

  import PlaybackStatusElement from "./PlaybackStatusElement.svelte";

  let time = Math.round(Date.now() / 1000);

  let playbackStatusTemplate = {
    title: false,
    directory: "",
    startTime: 0,
    fadeDuration: 0
  };

  let nowPlaying = Object.assign({}, playbackStatusTemplate);
  let fadingPlaying = Object.assign({}, playbackStatusTemplate);
  let nxtPlaying = Object.assign({}, playbackStatusTemplate);

  onMount(() => {
    const interval = setInterval(() => {
      if (playbackState2 && playbackState2.playing) {
        time = Math.round(Date.now() / 1000);
        if (playbackState2.playingFadeIn) {
          fadingPlaying.timeFromStart = Math.round(
            time - fadingPlaying.startTime
          );
          if (fadingPlaying.timeFromStart > fadingPlaying.fadeDuration) {
            playbackState2.playing = playbackState2.playingFadeIn;
            playbackState2.playingFadeIn = false;
            nowPlaying = fadingPlaying;
            delete nowPlaying.timeFromStart;
            fadingPlaying = false;
          }
        }
        if (playbackState2.playingAutoNext) {
          nxtPlaying.timeFromStart = Math.round(time - nxtPlaying.startTime);
          if (nxtPlaying.timeFromStart >= 0) {
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

  socket.on("nowplaying", function(playback) {
    // parse status object
    playbackState2 = JSON.parse(playback);

    if (playbackState2.playing) {
      nowPlaying = Object.assign(nowPlaying, {
        title: playbackState2.playing.metadata.title,
        directory: playbackState2.playing.directory,
        startTime: Math.round(playbackState2.playing.startTime / 1000),
        fadeDuration: Math.round(playbackState2.playing.fadeDuration / 1000)
      });
    }
    if (playbackState2.playingFadeIn) {
      fadingPlaying = Object.assign(fadingPlaying, {
        title: playbackState2.playingFadeIn.metadata.title,
        directory: playbackState2.playingFadeIn.directory,
        startTime: Math.round(playbackState2.playingFadeIn.startTime / 1000),
        fadeDuration: Math.round(
          playbackState2.playingFadeIn.fadeDuration / 1000
        )
      });
    }
    if (playbackState2.playingAutoNext) {
      nxtPlaying = Object.assign(nxtPlaying, {
        title: playbackState2.playingAutoNext.metadata.title,
        directory: playbackState2.playingAutoNext.directory,
        startTime: Math.round(playbackState2.playingAutoNext.startTime / 1000),
        fadeDuration: Math.round(
          playbackState2.playingAutoNext.fadeDuration / 1000
        )
      });
    }
    console.log(`svelte received playback status from server`);
    //console.log(`svelte received playback status from server:\n${JSON.stringify(playbackState2, null, 2)}`);
  });

  $: iframeSrc = nowPlaying.directory ? (nowPlaying.directory.startsWith('http') ? nowPlaying.directory : `/media/${nowPlaying.directory}/index.html`) : `/media/.default/index.html`;
</script>

<div class="playback-status">
  <div>
    <iframe
      src={iframeSrc}
      title={nowPlaying.title} />
  </div>

  <div>
  
    <div>
      <button id="reloadCurrentPageButton">Reload</button>
    </div>

    NOW PLAYING:
    <PlaybackStatusElement {...nowPlaying} />

    {#if fadingPlaying.title}
      FADING:
      <PlaybackStatusElement {...fadingPlaying} />
    {:else if nxtPlaying.title}
      NEXT:
      <PlaybackStatusElement {...nxtPlaying} />
    {/if}
  </div>
</div>

<style>
  iframe {
    width: 350px;
    height: 350px;
  }
  .playback-status {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    margin: 8px;
  }
  .playback-status > div {
    padding: 16px;
  }
</style>