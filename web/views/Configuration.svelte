<script>
  import ConfigurationSlider from "./ConfigurationInput.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  import { config, config_settings } from "./client_data.js";

  $: brightness = {
    name: "brightness",
    value: $config_settings.brightness || 0.0125,
    min: 0.0,
    max: 1.0,
    step: 0.0005
  };
  $: desaturation = {
    name: "desaturation",
    value: $config_settings.desaturation || 0.0,
    min: 0.0,
    max: 1.0,
    step: 0.01
  };
  $: gamma = {
    name: "gamma",
    value: $config_settings.gamma || 2.2,
    min: 0.0,
    max: 5.0,
    step: 0.01
  };
  $: blur = {
    name: "blur",
    value: $config_settings.blur || 50,
    min: 0,
    max: 48,
    step: 1
  };
  $: fade = {
    name: "fade",
    value: $config_settings.fade || 25000,
    min: 0,
    max: 25000,
    step: 100
  };
  $: autoplayDurationMin = {
    name: "autoplayMinRange",
    value: $config_settings.autoplayDuration.min || 30000,
    min: 500,
    max: 300000,
    step: 1000
  };
  $: autoplayDurationMax = {
    name: "autoplayMaxRange",
    value: $config_settings.autoplayDuration.max || 60000,
    min: 500,
    max: 300000,
    step: 1000
  };
  $: autoClickPeriod = {
    name: "autoClickPeriod",
    value: $config_settings.autoClickPeriod || 0,
    min: 0,
    max: 15000,
    step: 1000
  };
</script>

<style>
  #config-main {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    justify-content: center;
  }
  #config-main > * {
    text-align: center;
  }
  .config--control {
    padding: 2em;
  }
</style>

<div id="config-main">

  {#each [brightness, desaturation, gamma, blur, fade, autoplayDurationMin, autoplayDurationMax, autoClickPeriod] as item}
    <div class="config--control">
      <ConfigurationSlider {...item} />
    </div>
  {/each}

</div>
