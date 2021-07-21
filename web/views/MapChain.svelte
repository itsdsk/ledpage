<script>
  export let output;
  export let selected = false;
</script>

<g on:click>
  {#each output.leds as led, i}
    <circle cx={led.x} cy={led.y} class:selected />
    {#if i < output.leds.length - 1}
      <line
        class:selected
        x1={led.x}
        y1={led.y}
        x2={output.leds[i + 1].x}
        y2={output.leds[i + 1].y}
      />
    {/if}
  {/each}
</g>

<style>
  circle.selected,
  g:hover > circle {
    fill: #1c1c1c;
    stroke-width: 6px;
  }
  line.selected,
  g:hover > line {
    stroke-width: 4px;
    stroke-linecap: round;
  }
  line {
    stroke: white;
    stroke-width: 1px;
  }
  circle {
    fill: white;
    stroke: white;
    r: 10px;
  }
</style>
