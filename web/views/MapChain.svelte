<script>
  export let output;
  export let selected = false;
  export let nodeIndex = -1;
</script>

<g class:selected>
  {#each output.leds as led, i}
    {#if i != output.leds.length - 1}
      <line
        x1={led.x}
        y1={led.y}
        x2={output.leds[i + 1].x}
        y2={output.leds[i + 1].y}
      />
    {/if}
  {/each}
  {#each output.leds as led, i}
    <circle
      on:click
      cx={led.x}
      cy={led.y}
      class:highlight={nodeIndex == i}
      data-index={i}
    />
  {/each}
</g>

<style>
  line {
    stroke: #5b86b4;
    stroke-width: 1px;
  }

  circle {
    fill: #5b86b4;
    stroke-width: 0px;
    r: 11px;
  }

  circle:hover,
  g.selected > circle.highlight {
    fill: white;
  }

  circle:active {
    fill: #626262;
  }
</style>
