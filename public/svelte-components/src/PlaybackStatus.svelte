<script>
  import { onMount } from "svelte";
  import PlaybackStatusElement from "./PlaybackStatusElement.svelte";
  import { livePlaybackStatus } from './stores.js';

  onMount(() => {
    //
  });

  $: iframeSrc = $livePlaybackStatus.nowPlaying ? ($livePlaybackStatus.nowPlaying.directory.startsWith('http') ? $livePlaybackStatus.nowPlaying.directory : `/media/${$livePlaybackStatus.nowPlaying.directory}/index.html`) : `about:blank`;

</script>

<div class="playback-status">
  <div>
    <iframe
      src={iframeSrc}
      title={$livePlaybackStatus.nowPlaying ? $livePlaybackStatus.nowPlaying.title : 'Nothing playing'} />
  </div>

  <div>
  
    <div>
      <button id="reloadCurrentPageButton">Reload</button>
    </div>

    NOW PLAYING:
    <PlaybackStatusElement {...$livePlaybackStatus.nowPlaying} />

    NEXT:
    {#if $livePlaybackStatus.nextPlaying}
      <PlaybackStatusElement {...$livePlaybackStatus.nextPlaying} />
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