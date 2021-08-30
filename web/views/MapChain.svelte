<script>
  export let output;
  export let selected = false;
  export let nodeIndex = -1;

  let nodeRadius = `${
    Math.sqrt(
      Math.pow(output.leds[0].x - output.leds[1].x, 2) +
        Math.pow(output.leds[0].y - output.leds[1].y, 2)
    ) /
      2 -
    0.75
  }px`;
</script>

<g class:selected style="--node-radius: {nodeRadius}">
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
    r: var(--node-radius);
  }

  circle:hover,
  g.selected > circle.highlight {
    fill: white;
  }

  circle:active {
    fill: #626262;
  }
</style>
