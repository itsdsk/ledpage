<script>
  import PlaybackStatus from "./PlaybackStatus.svelte";
  import PlaybackStatusElement from "./PlaybackStatusElement.svelte";
  import Configuration from "./Configuration.svelte";
  import ConfigurationSlider from "./ConfigurationInput.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  import MediaFeed from "./MediaFeed.svelte";
  import {
    config,
    config_settings,
    livePlaybackStatus,
    mediaFeedObjects,
    channelObjects
  } from "./client_data.js";
  import { tweened } from "svelte/motion";

  let showConfig = false;
  $: iframeSrc = $livePlaybackStatus.nowPlaying
    ? $livePlaybackStatus.nowPlaying.directory.startsWith("http")
      ? $livePlaybackStatus.nowPlaying.directory
      : `/media/${$livePlaybackStatus.nowPlaying.directory}/index.html`
    : `about:blank`;

  $: brightness = {
    name: "brightness",
    value: $config_settings.brightness || 0.0125,
    min: 0.0,
    max: 1.0,
    step: 0.0005
  };

  let urlinputelement;
  let urlInputValid = false;

  function playURL() {
    if (urlinputelement.value.length > 0 && urlinputelement.matches(":valid")) {
      // URL is validated
      socket.emit("playURL", urlinputelement.value);
      console.log(`playing URL: ${urlinputelement.value}`);
    }
  }

  function downloadURL() {
    if (urlinputelement.value.length > 0 && urlinputelement.matches(":valid")) {
      // URL is validated
      socket.emit("createmediaURL", urlinputelement.value);
      console.log(`createmediaURL: ${urlinputelement.value}`);
    } else {
      console.log("cannot create media from URL as it is invalid");
    }
  }

  let scrollY;

  let fileUploadText = "";
  function handleFiles() {
    // check 1 file was selected
    if (this.files.length == 1) {
      // update status string
      fileUploadText = `${this.files[0].name} (${
        this.files[0].size
      } bytes, modified: ${new Date(
        this.files[0].lastModified
      ).toLocaleString()})`;
      // check file type
      if (this.files[0].type == "application/json") {
        // read file and parse JSON
        var reader = new FileReader();
        reader.onload = (function() {
          return function(event) {
            var jsonconf;
            try {
              jsonconf = JSON.parse(event.target.result);
            } catch (exception) {
              alert("exception caught when parsing json: " + exception);
            }
            // update status string
            fileUploadText = `Uploaded ${fileUploadText}`;
            // send uploaded config to server
            socket.emit("updateconfigfile", jsonconf);
          };
        })(this.files[0]);
        reader.readAsText(this.files[0]);
      }
    }
  }

  function sendScreenshot() {
    console.log("sending screenshot request cmd");
    // test to save screenshot on click
    if (mainSocket.readyState != 1) {
      mainSocket = new WebSocket(
        "ws://" +
          (window.location.hostname ? window.location.hostname : "localhost") +
          ":9002"
      );
      console.log("main socket not connected");
    }
    mainSocket.send(
      JSON.stringify({
        command: "screenshot"
      })
    );
  }

  let nextPlayingImg = null;

  $: updateNextPlayingImg($livePlaybackStatus);

  $: progressStatus = $livePlaybackStatus.nextPlaying
    ? $livePlaybackStatus.nextPlaying.timeFromStart < 0
      ? "waiting"
      : "fading"
    : "static";

  function updateNextPlayingImg() {
    if ($livePlaybackStatus.nextPlaying) {
      // update progress bar TODO use progressStatus in progressval
      var progressVal =
        $livePlaybackStatus.nextPlaying.timeFromStart < 0
          ? -$livePlaybackStatus.nextPlaying.timeFromStart /
            $config_settings.autoplayDuration.max
          : $livePlaybackStatus.nextPlaying.timeFromStart /
            $livePlaybackStatus.nextPlaying.fadeDuration;
      playbackProgress.set(progressVal);
      // update image...
      // get next playing's media feed index
      var feedIndex = $mediaFeedObjects.findIndex(
        mediaItem =>
          mediaItem.directory === $livePlaybackStatus.nextPlaying.directory
      );
      // check next playing was found
      if (feedIndex == -1) {
        nextPlayingImg = null;
      } else {
        nextPlayingImg = $mediaFeedObjects[feedIndex].image;
      }
    } else {
      nextPlayingImg = null;
      // set progress bar to default value
      playbackProgress.set(1.0);
    }
  }

  const playbackProgress = tweened(0, {
    duration: 1000
  });

  let activeOutputChain = null;

  function handleRestartBtn(e) {
    //
    let actionStr = prompt(`Restart system/renderer/backend/ui:`).toLowerCase();
    switch (actionStr) {
      case "system":
        socket.emit("systempower", "reboot");
        break;
      case "renderer":
        socket.emit("restartservice", "disk-renderer-daemon");
        break;
      case "backend":
        socket.emit("restartservice", "disk-backend-daemon");
        break;
      case "ui":
        socket.emit("restartservice", "disk-ui-daemon");
        break;
      default:
      //
    }
  }

  function transformOutputNodes(mode = "rotate") {
    switch (mode) {
      case "rotate":
        // 90deg CW
        var newConfig = $config;
        for (var i = 0; i < newConfig.outputs.length; i++) {
          for (var k = 0; k < newConfig.outputs[i].leds.length; k++) {
            // remap Y value from 0-height to 0-width
            var newX =
              (newConfig.outputs[i].leds[k].y / newConfig.window.height) *
              newConfig.window.width;
            // remap X value from 0-width to 0-height
            var newY =
              (newConfig.outputs[i].leds[k].x / newConfig.window.width) *
              newConfig.window.height;
            // rotate 90deg CW: replace (x, y) with (-y, x)
            newConfig.outputs[i].leds[k].x = newConfig.window.width - Math.round(newX);
            newConfig.outputs[i].leds[k].y = Math.round(newY);
          }
        }
        // set locally
        $config = newConfig;
        break;
      case "flip":
        // horizontal flip
        var newConfig = $config;
        for (var i = 0; i < newConfig.outputs.length; i++) {
          for (var k = 0; k < newConfig.outputs[i].leds.length; k++) {
            newConfig.outputs[i].leds[k].x =
              newConfig.window.width - newConfig.outputs[i].leds[k].x;
          }
        }
        // set locally
        $config = newConfig;
        break;
      default:
      //
    }
  }
</script>

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
    /* text-align: left; */
  }

  .header-main > * {
    text-align: center;
  }

  .header-main > *:last-child {
    text-align: right;
  }

  .header-main > *:first-child {
    display: flex;
  }

  .url-input {
    border: none;
    border-bottom: 1px solid;
    flex-grow: 2;
    /* display: inline-block;
        max-width: 100%; */
  }

  .url-input--btn {
    margin-left: 0.75em;
  }

  .preview-container {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: center;
    margin: 2em 0em;
  }

  .preview-container--child {
    flex-basis: 360px;
    display: flex;
    flex-direction: column;
    /* justify-content: space-between; */
    /* justify-content: center; */
    padding: 16px;
  }

  .preview-container--child:first-of-type {
    justify-content: center;
  }

  .preview-container--child:last-of-type {
    justify-content: space-between;
  }

  .preview-container--child:last-of-type > * {
    margin: 16px;
  }

  iframe {
    width: 350px;
    height: 350px;
  }

  .preview-container--next-playing {
    display: flex;
    align-items: center;
  }

  .now-playing--title {
    font-size: 1.75em;
    margin-top: 4px;
    margin-bottom: 0;
  }

  .now-playing--link {
    margin-top: 4px;
    font-size: 0.75em;
    overflow: hidden;
    white-space: nowrap;
    max-width: 360px;
    text-overflow: ellipsis;
  }

  .now-playing--link:not(:hover) > a {
    color: black;
    text-decoration: none;
  }

  progress {
    display: block;
    width: 100%;
    height: 4px;
    margin-top: 8px;
    background-color: #eee;
  }

  progress.fading {
    /* background-color: #a00;
    opacity: 50%; */
  }
  progress.waiting {
    /* background-color: #0a0; */
    opacity: 10%;
  }
  progress.static {
    /* background-color: #00a; */
    opacity: 10%;
  }

  .preview-container--next-playing > *:first-child {
    /* vertical-align: middle; */
    padding-right: 8px;
  }

  .preview-container--next-playing > *:nth-child(2) {
    /* vertical-align: middle; */
    flex-grow: 2;
  }
  .preview-container--label {
    margin-top: 0;
    margin-bottom: 4px;
  }

  .preview-container--outputs-list > p {
    margin-top: 0;
    margin-bottom: 0;
  }

  img.next-thumbnail {
    max-width: 64px;
    display: inline;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  td,
  th {
    border: 2px solid #ffffff;
    text-align: left;
    padding: 8px;
  }

  tr:not(:first-child):not(.activeOutputChain) {
    background-color: #dddddd;
  }

  .activeOutputChain {
    font-style: italic;
    background-color: #bcbcbc;
  }

  .preview-container--btn-div {
    margin: 1em 0;
  }

  .preview-container--btn-div > button {
    padding: 0;
  }

  .preview-container--btn-div > b {
    display: block;
    font-size: 1em;
    text-transform: uppercase;
    padding: 0.3em 0;
  }
</style>

<svelte:window bind:scrollY />

<div class="header-main">
  <div class="url-input--container">
    <input
      class="url-input"
      bind:this={urlinputelement}
      type="url"
      placeholder="Enter URL to display"
      required
      on:keyup={e => {
        if (e.keyCode == 13) playURL();
      }}
      on:input={() => {
        urlInputValid = urlinputelement.matches(':valid');
      }} />
    <button class="url-input--btn" disabled={!urlInputValid} on:click={playURL}>
      Play
    </button>
  </div>
  {#if scrollY > 400 || showConfig}
    <div>
      NOW PLAYING:
      <PlaybackStatusElement {...$livePlaybackStatus.nowPlaying} />
    </div>
    <div>
      NEXT:
      <PlaybackStatusElement {...$livePlaybackStatus.nextPlaying} />
    </div>
  {/if}
  <div on:click={() => (showConfig = !showConfig)}>
    {showConfig ? 'Back' : 'Settings'}
  </div>
</div>

<div class="preview-container">

  <div class="preview-container--child">
    {#if showConfig}
      <MapContainer>
        {#each $config.outputs as output, i}
          <MapChain
            {output}
            visibility={activeOutputChain == i ? 'visible' : 'hidden'}
            on:click={() => (activeOutputChain = i)} />
        {/each}
      </MapContainer>
    {:else}
      <iframe
        src={iframeSrc}
        title={$livePlaybackStatus.nowPlaying ? $livePlaybackStatus.nowPlaying.title : 'Nothing playing'} />
    {/if}
  </div>

  <div class="preview-container--child">
    {#if showConfig}
      <div>
        <h4 class="preview-container--label">OUTPUT</h4>
        <p class="now-playing--title">
          <var>
            {$config.outputs.reduce((accumulator, currentValue) => {
              return accumulator + currentValue.leds.length;
            }, 0)}
          </var>
          LEDs
        </p>
      </div>
      <div class="preview-container--outputs-list">
        <table>
          <tr>
            <th>Type</th>
            <th>Count</th>
            <th>Color Order</th>
          </tr>
          {#each $config.outputs as output, i}
            <tr
              class:activeOutputChain={activeOutputChain === i}
              on:click={() => (activeOutputChain = activeOutputChain === i ? null : i)}>
              <td>{output.type}</td>
              <td>{output.leds.length}</td>
              <td>{output.properties.colorOrder}</td>
            </tr>
          {/each}
        </table>
        <div class="preview-container--btn-div">
          <b>MAP:</b>
          <button on:click={() => transformOutputNodes('rotate')}>
            Rotate 90° CW
          </button>
          <button on:click={() => transformOutputNodes('flip')}>
            Flip horizontal
          </button>
          <br />
          <b>System:</b>
          <button on:click={() => socket.emit('getlogs')}>Get logs</button>
          <!-- todo: handle response e.g. by printing to console -->
          <button on:click={handleRestartBtn}>Restart</button>
          <button
            on:click={() => {
              if (window.confirm(`Shutdown system?`)) socket.emit('systempower', 'shutdown');
            }}>
            Shutdown
          </button>
          <input
            type="file"
            accept="application/json"
            style="display:none"
            on:change={handleFiles} />
          <br />
          <b>Startup Playlist:</b>
          <select bind:value={$config_settings.startupPlaylist} on:change={e => socket.emit('startupplaylist', e.target.value)}>
            {#each $channelObjects as channelObject}
              <option value={channelObject.channel_name || ''}>
                {channelObject.channel_name || 'all media'} ({channelObject.count})
              </option>
            {/each}
          </select>
          <br />
          <b>Config:</b>
          <button
            on:click|preventDefault|stopPropagation={() => document
                .querySelector("input[type='file']")
                .click()}>
            Upload
          </button>
          <button on:click={() => socket.emit('saveconfig')}>Save</button>
        </div>
        {#if fileUploadText.length}
          <p>{fileUploadText}</p>
        {/if}
      </div>
    {:else}
      <div>
        <h4 class="preview-container--label">
          {$livePlaybackStatus.nextPlaying && $livePlaybackStatus.nextPlaying.timeFromStart > 0.0 && $livePlaybackStatus.nextPlaying.timeFromStart < $livePlaybackStatus.nextPlaying.fadeDuration ? 'FADING' : 'NOW PLAYING'}
        </h4>
        <p class="now-playing--title">
          {#if $livePlaybackStatus.nowPlaying}
            {#if $livePlaybackStatus.nowPlaying.title === '<Live URL>'}
              Live URL
              <button on:click={downloadURL}>Download</button>
            {:else}{$livePlaybackStatus.nowPlaying.title}{/if}
          {:else}Nothing{/if}
        </p>
        <div class="now-playing--link">
          <a href={iframeSrc}>{iframeSrc}</a>
        </div>
        <progress class={progressStatus} value={$playbackProgress} />
      </div>
      <div>
        <div class="preview-container--next-playing">
          <img src={nextPlayingImg} alt="" class="next-thumbnail" />
          <div>
            <h4 class="preview-container--label">NEXT</h4>
            <PlaybackStatusElement {...$livePlaybackStatus.nextPlaying} />
          </div>
        </div>
      </div>
      <div>
        <ConfigurationSlider {...brightness} />
        <div class="preview-container--btn-div">
          <b>Display:</b>
          <button disabled>Refresh</button>
          <button on:click={sendScreenshot}>Screenshot</button>
          <button on:click={() => socket.emit('fakemouseinput')}>
            Mouse click
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- <div style="padding: 150px;"> -->
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
