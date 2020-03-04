<script>
  import ConfigurationSlider from "./ConfigurationSlider.svelte";
  let config;
  socket.on("configuration", function(conf) {
    config = conf;
    // set values from config
    brightness.value = config.settings.brightness;
    desaturation.value = config.settings.desaturation;
    gamma.value = config.settings.gamma;
    blur.value = config.settings.blur;
    fade.value = config.settings.fade;
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
</script>

{#each [brightness, desaturation, gamma, blur, fade] as item}
  <ConfigurationSlider {...item} />
{/each}
