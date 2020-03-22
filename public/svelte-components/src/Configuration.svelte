<script>
  import ConfigurationSlider from "./ConfigurationSlider.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  let config;
  let activeChain;
  let showAll;
  socket.on("configuration", function(conf) {
    config = conf;
    // set values from config
    brightness.value = config.settings.brightness;
    desaturation.value = config.settings.desaturation;
    gamma.value = config.settings.gamma;
    blur.value = config.settings.blur;
    fade.value = config.settings.fade;
    autoplayDurationMin.value = config.settings.autoplayDuration.min;
    autoplayDurationMax.value = config.settings.autoplayDuration.max;
  });
  let brightness = {
    name: "brightness",
    value: 0.0125,
    min: 0.0,
    max: 1.0,
    step: 0.0005
  };
  let desaturation = {
    name: "desaturation",
    value: 0.0,
    min: 0.0,
    max: 1.0,
    step: 0.01
  };
  let gamma = { name: "gamma", value: 2.2, min: 0.0, max: 5.0, step: 0.01 };
  let blur = { name: "blur", value: 50, min: 1, max: 48, step: 1 };
  let fade = { name: "fade", value: 25000, min: 0, max: 25000, step: 100 };
  let autoplayDurationMin = { name: "autoplayMinRange", value: 30000, min: 15000, max: 300000, step: 1000 };
  let autoplayDurationMax = { name: "autoplayMaxRange", value: 60000, min: 15000, max: 300000, step: 1000 };

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

<p
  style="text-align:center;"
  on:click={() => showAll = !showAll}
>
  {showAll ? 'Close' : 'Open'}Settings
</p>

<div id="config-main">

  {#if showAll}

    {#if config}
      <div id="config-main__map">
      
        <MapContainer>
          {#each config.outputs as output}
            <MapChain fillColour={activeChain === output ? 'black' : 'white'} {output} on:click={() => { activeChain = output; }}/>
          {/each}
        </MapContainer>
      
        <p>Output has {config.outputs.reduce((accumulator, currentValue) => {return accumulator + currentValue.leds.length}, 0)} LEDs in {config.outputs.length} chains</p>
      
        <input type="file" accept="application/json" style="display:none" on:change={handleFiles}>
        <a href="#" on:click|preventDefault|stopPropagation={() => document.querySelector("input[type='file']").click()}>Upload config file</a>
        {#if fileUploadText.length}
          <p>{fileUploadText}</p>
        {/if}

        <p>
          Chain:
          {#if activeChain}
            #{activeChain.index}: Type: {activeChain.properties.type} LEDs: {activeChain.leds.length}
          {:else}
            None selected...
          {/if}
        </p>

      </div>

    {/if}

    <div>
      {#each [brightness, desaturation, gamma, blur, fade, autoplayDurationMin, autoplayDurationMax] as item}
        <div>
          <ConfigurationSlider {...item} />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  #config-main {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    flex-direction: row;
    align-items: flex-start;
    background-color: rgba(0, 0, 0, 0.50);
    margin: 8px;
  }
  #config-main__map {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>