<script>
  import { onMount, afterUpdate } from "svelte";

  let svg;
  let width = "0";
  let height = "0";
  let windowWidth = 10;

  const resizeSVG = () => {
      let svgBoundingBox = svg.getBBox();
      width = svgBoundingBox.x + svgBoundingBox.width + svgBoundingBox.x;
      height = svgBoundingBox.y + svgBoundingBox.height + svgBoundingBox.y;
  }

  onMount(resizeSVG);
  afterUpdate(resizeSVG);
</script>

<svelte:window on:resize={resizeSVG} bind:innerWidth={windowWidth} />

<svg viewBox="0 0 {width} {height}" width={Math.min(windowWidth - 10, 360)} style="border:1px solid black" bind:this={svg}>
  <slot />
</svg>
