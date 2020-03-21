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
      {Math.abs(timeFromStart)}
    {:else}{timeFromStart}/{fadeDuration}{/if}
    s)
  {/if}
</p>
