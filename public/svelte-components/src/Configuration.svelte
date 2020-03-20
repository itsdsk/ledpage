<script>
  import ConfigurationSlider from "./ConfigurationSlider.svelte";
  import MapContainer from "./MapContainer.svelte";
  import MapChain from "./MapChain.svelte";
  let config;
  let activeChain;
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
</script>

{#each [brightness, desaturation, gamma, blur, fade, autoplayDurationMin, autoplayDurationMax] as item}
  <ConfigurationSlider {...item} />
{/each}

{#if config}
  <h1>Config ({config.outputs.reduce((accumulator, currentValue) => {return accumulator + currentValue.leds.length}, 0)} LEDs in {config.outputs.length} chains)</h1>
  {#if activeChain}
    <h2>Chain {activeChain.index}: Type: {activeChain.properties.type} LEDs: {activeChain.leds.length}</h2>
  {:else}
    <h2>No chain selected</h2>
  {/if}
  <MapContainer>
    {#each config.outputs as output}
      <MapChain fillColour={activeChain === output ? 'white' : 'black'} {output} on:click={() => { activeChain = output; }}/>
    {/each}
  </MapContainer>
{/if}