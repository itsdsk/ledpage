<script>
  import ConfigurationSlider from "./ConfigurationSlider.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  import { config } from './stores.js';

  $: brightness = {
    name: "brightness",
    value: $config.settings.brightness || 0.0125,
    min: 0.0,
    max: 1.0,
    step: 0.0005
  };
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

</script>
<div id="config-main">

  {#each [brightness, desaturation, gamma, blur, fade, autoplayDurationMin, autoplayDurationMax] as item}
    <div>
      <ConfigurationSlider {...item} />
    </div>
  {/each}

</div>

<style>
  #config-main {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(600px, 1fr));
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    justify-content: center;
  }
  #config-main > * {
    text-align: center;
  }
</style>