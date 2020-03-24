<script>
  import PlaybackStatus from "./PlaybackStatus.svelte";
  import Configuration from "./Configuration.svelte";
  import ConfigurationSlider from "./ConfigurationSlider.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  import MediaFeed from './MediaFeed.svelte';
  import { config, livePlaybackStatus } from './stores.js';

  let showConfig = false;
  $: iframeSrc = $livePlaybackStatus.nowPlaying ? ($livePlaybackStatus.nowPlaying.directory.startsWith('http') ? $livePlaybackStatus.nowPlaying.directory : `/media/${$livePlaybackStatus.nowPlaying.directory}/index.html`) : `about:blank`;

  $: brightness = {
    name: "brightness",
    value: $config.settings.brightness || 0.0125,
    min: 0.0,
    max: 1.0,
    step: 0.0005
  };

</script>

<div class="preview-container">

    <div class="preview-container--child">
        {#if showConfig}
            <MapContainer>
                {#each $config.outputs as output}
                    <MapChain {output} />
                {/each}
            </MapContainer>
        {:else}
            <iframe
            src={iframeSrc}
            title={$livePlaybackStatus.nowPlaying ? $livePlaybackStatus.nowPlaying.title : 'Nothing playing'} />
        {/if}
    </div>

    <div class="preview-container--child">
        <p>Output: {$config.outputs.reduce((accumulator, currentValue) => {return accumulator + currentValue.leds.length}, 0)} LEDs in {$config.outputs.length} chains</p>
        <ConfigurationSlider {...brightness} />
        <div>
            <input type=checkbox bind:checked={showConfig}>
        </div>
    </div>
</div>

<div>

  {#if showConfig}
    <div>
        <Configuration />
    </div>
  {:else}
    <div>
        <MediaFeed />
    </div>
  {/if}
</div>

<style>

    .preview-container {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: center;
    }

    .preview-container--child {
        flex-basis: 360px;
    }

    .preview-container--child:first-child {
        height: 400px;
    }

    iframe {
        width: 350px;
        height: 350px;
    }

</style>
