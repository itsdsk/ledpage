<script>
  import { draw, blur } from "svelte/transition";
  export let output;
  export let fillColour = "#333";
  export let visibility = "hidden";

  let circleDuration = 500;
</script>

<style>
  line {
    stroke: black;
    stroke-width: 2px;
  }
  circle {
    stroke: black;
    stroke-width: 2px;
  }
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
      r={6}
      fill={visibility === 'hidden' ? '#dddddd' : 'black'}
      on:click />
    {#if i < output.leds.length - 1}
      <line
        {visibility}
        x1={led.x}
        y1={led.y}
        x2={output.leds[i + 1].x}
        y2={output.leds[i + 1].y} />
    {/if}
  {/each}
</g>
