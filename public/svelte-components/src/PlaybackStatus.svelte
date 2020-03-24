<script>
  import { onMount } from "svelte";
  import PlaybackStatusElement from "./PlaybackStatusElement.svelte";
  import {
    nowPlaying,
    fadingPlaying,
    nxtPlaying,
    playingFadeInTimeFromStart,
    playingAutoNextTimeFromStart
    } from './stores.js';

  onMount(() => {
    //
  });

  $: iframeSrc = $nowPlaying ? ($nowPlaying.directory.startsWith('http') ? $nowPlaying.directory : `/media/${$nowPlaying.directory}/index.html`) : `about:blank`;

</script>

<div class="playback-status">
  <div>
    <iframe
      src={iframeSrc}
      title={$nowPlaying ? $nowPlaying.title : 'Nothing playing'} />
  </div>

  <div>
  
    <div>
      <button id="reloadCurrentPageButton">Reload</button>
    </div>

    NOW PLAYING:
    <PlaybackStatusElement {...$nowPlaying} />

    {#if $fadingPlaying}
      FADING:
      <PlaybackStatusElement {...$fadingPlaying} timeFromStart={$playingFadeInTimeFromStart} />
    {:else if $nxtPlaying}
      NEXT:
      <PlaybackStatusElement {...$nxtPlaying} timeFromStart={$playingAutoNextTimeFromStart} />
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