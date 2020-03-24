<script>
  export let title = false;
  export let directory = "";
  export let startTime = 0;
  export let fadeDuration = false;
  export let timeFromStart = false;
</script>

<p>
  {title || 'Nothing...'}
  {#if timeFromStart}
    (
    {#if timeFromStart < 0}
      {Math.round(Math.abs(timeFromStart) / 1000)}
    {:else}{Math.round(timeFromStart / 1000)}/{Math.round(fadeDuration / 1000)}{/if}
    s)
  {/if}
</p>
