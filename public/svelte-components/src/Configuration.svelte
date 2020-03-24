<script>
  import ConfigurationSlider from "./ConfigurationSlider.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  import { config } from './stores.js';

  $: desaturation = {
    name: "desaturation",
    value: $config.settings.desaturation || 0.0,
    min: 0.0,
    max: 1.0,
    step: 0.01
  };
  $: gamma = { name: "gamma", value: $config.settings.gamma || 2.2, min: 0.0, max: 5.0, step: 0.01 };
  $: blur = { name: "blur", value: $config.settings.blur || 50, min: 1, max: 48, step: 1 };
  $: fade = { name: "fade", value: $config.settings.fade || 25000, min: 0, max: 25000, step: 100 };
  $: autoplayDurationMin = { name: "autoplayMinRange", value: $config.settings.autoplayDuration.min || 30000, min: 15000, max: 300000, step: 1000 };
  $: autoplayDurationMax = { name: "autoplayMaxRange", value: $config.settings.autoplayDuration.max || 60000, min: 15000, max: 300000, step: 1000 };

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

<div id="config-main">

  <div>
    <input type="file" accept="application/json" style="display:none" on:change={handleFiles}>
    <a href="#" on:click|preventDefault|stopPropagation={() => document.querySelector("input[type='file']").click()}>Upload config file</a>
    {#if fileUploadText.length}
      <p>{fileUploadText}</p>
    {/if}
  </div>

  {#each [desaturation, gamma, blur, fade, autoplayDurationMin, autoplayDurationMax] as item}
    <div>
      <ConfigurationSlider {...item} />
    </div>
  {/each}

</div>

<style>
  #config-main {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(250px, 1fr));
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    justify-content: center;
  }
</style>