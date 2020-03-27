<script>
  import { draw, blur } from "svelte/transition";
  export let output;
  export let fillColour = "#333";

  let circleDuration = 500;
  let lineDuration = 400;
  let lineDelay = 100;
</script>

<style>
  line {
    stroke: black;
    stroke-width: 4px;
  }
  /* circle {
    fill: black;
  } */
  circle:hover {
    fill: dimgray;
  }
</style>

<g>
  {#each output.leds as led, i}
    <circle
      in:blur={{ duration: circleDuration }}
      cx={led.x}
      cy={led.y}
      r={10}
      fill={fillColour}
      on:click />
    {#if i < output.leds.length - 1}
      <line
        in:draw={{ delay: i * lineDelay, duration: lineDuration }}
        x1={led.x}
        y1={led.y}
        x2={output.leds[i + 1].x}
        y2={output.leds[i + 1].y} />
    {/if}
  {/each}
</g>
