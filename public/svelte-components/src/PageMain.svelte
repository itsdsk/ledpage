<script>
  import PlaybackStatus from "./PlaybackStatus.svelte";
  import PlaybackStatusElement from "./PlaybackStatusElement.svelte";
  import Configuration from "./Configuration.svelte";
  import ConfigurationSlider from "./ConfigurationSlider.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  import MediaFeed from './MediaFeed.svelte';
  import { config, livePlaybackStatus, mediaFeedObjects } from './stores.js';

  let showConfig = false;
  $: iframeSrc = $livePlaybackStatus.nowPlaying ? ($livePlaybackStatus.nowPlaying.directory.startsWith('http') ? $livePlaybackStatus.nowPlaying.directory : `/media/${$livePlaybackStatus.nowPlaying.directory}/index.html`) : `about:blank`;

  $: brightness = {
    name: "brightness",
    value: $config.settings.brightness || 0.0125,
    min: 0.0,
    max: 1.0,
    step: 0.0005
  };

  let urlinputelement;
  function playURL(event) {
      if (event.keyCode == 13) { // 'Enter'
        if (event.target.value.length > 0 && event.target.matches(':valid')) { // URL is validated
          socket.emit('playURL', event.target.value);
          console.log(`playing URL: ${event.target.value}`);
        }
      }
  }

  function downloadURL() {
    if (urlinputelement.value.length > 0 && urlinputelement.matches(':valid')) { // URL is validated
        socket.emit('createmediaURL', urlinputelement.value);
        console.log(`createmediaURL: ${urlinputelement.value}`);
    } else {
        console.log('cannot create media from URL as it is invalid');
    }
  }

  let scrollY;

    let fileUploadText = '';
  function handleFiles() {
    // check 1 file was selected
    if (this.files.length == 1) {
      // update status string
      fileUploadText = `${this.files[0].name} (${this.files[0].size} bytes, modified: ${(new Date(this.files[0].lastModified).toLocaleString())})`;
      // check file type
      if (this.files[0].type == 'application/json') {
        // read file and parse JSON
        var reader = new FileReader();
        reader.onload = (function () {
            return function (event) {
                var jsonconf;
                try {
                    jsonconf = JSON.parse(event.target.result);
                } catch (exception) {
                    alert('exception caught when parsing json: ' + exception);
                }
                // update status string
                fileUploadText = `Uploaded ${fileUploadText}`;
                // send uploaded config to server
                socket.emit('updateconfigfile', jsonconf);
            };
        })(this.files[0]);
        reader.readAsText(this.files[0]);
      }
    }
  }

</script>

<svelte:window bind:scrollY={scrollY}/>

<div class="header-main">
    <div>
        <input
        class="url-input"
        bind:this={urlinputelement}
        type=url
        placeholder="Enter URL to display"
        on:keyup={playURL}
        >
        <button class="url-input--download-btn" on:click={downloadURL}>
            Download
        </button>
    </div>
    {#if scrollY > 400}
        <div>
        NOW PLAYING: <PlaybackStatusElement {...$livePlaybackStatus.nowPlaying} />
        </div>
    {/if}
        <div>
        NEXT: <PlaybackStatusElement {...$livePlaybackStatus.nextPlaying} />
        </div>
        <div on:click={()=>showConfig=!showConfig}>
            Config
        </div>
</div>

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
        <p>NOW PLAYING</p>
        <PlaybackStatusElement {...$livePlaybackStatus.nowPlaying} />
        <p></p>
        {#if showConfig}
            <div>
                <h4 class="preview-container--label">CONFIGURATION</h4>
                <p class="now-playing--title"><var>{$config.outputs.reduce((accumulator, currentValue) => {return accumulator + currentValue.leds.length}, 0)}</var> LEDs</p>
            </div>
            <div class="preview-container--outputs-list">
                <h4 class="preview-container--label">OUTPUTS</h4>
                {#each $config.outputs as output, i}
                    <p><strong>{i}</strong> <var>{output.properties.type}</var>, <var>{output.properties.colorOrder}</var></p>
                {/each}
            </div>
            <input type="file" accept="application/json" style="display:none" on:change={handleFiles}>
            <a href="#" on:click|preventDefault|stopPropagation={() => document.querySelector("input[type='file']").click()}>Upload config file</a>
            {#if fileUploadText.length}
                <p>{fileUploadText}</p>
            {/if}
        {:else}
            <ConfigurationSlider {...brightness} />
        {/if}
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

    .header-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        /* margin: 8px; */
        /* margin-bottom: 16px; */
        /* border-bottom: 2px solid grey; */
        position: sticky;
        top: 0;
        background: white;
        z-index: 100;
        /* position: fixed;
        top: 0;
        width: 100%;
        background: white; */
    }

    .header-main > * {
        flex: 1 1 0;
    }

    .header-main > *:first-child {
        text-align: left;
    }

    .header-main > * {
        text-align: center;
    }

    .header-main > *:last-child {
        text-align: right;
    }

    .url-input {
        border: none;
        /* width: 100%; */
    }

    /* input:invalid {
        background-color: red;
    } */

    .url-input--download-btn {
        display: none;
    }

    .header-main > *:first-child:hover .url-input--download-btn {
        display: inline;
    }

    .preview-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        margin-top: 48px;
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
