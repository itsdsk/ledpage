<script>
  export let output;
  export let fillColour = "#333";
</script>

<style>
  line {
    stroke: white;
    stroke-width: 2px;
  }
  /* circle {
    fill: black;
  } */
  circle:hover {
    fill: white;
  }
</style>

<g>
  {#each output.leds as led, i}
    <circle cx={led.x} cy={led.y} r={10} fill={fillColour} on:click />
    {#if i < output.leds.length - 1}
      <line
        x1={led.x}
        y1={led.y}
        x2={output.leds[i + 1].x}
        y2={output.leds[i + 1].y} />
    {/if}
  {/each}
</g>
