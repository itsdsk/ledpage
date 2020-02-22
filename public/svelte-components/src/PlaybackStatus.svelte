<script>
  export let title = false;
  export let directory = "";
  export let startTime = 0;
  export let fadeDuration = false;
  export let timeFromStart;
</script>

<p>
  {title}
  {#if timeFromStart}
    {timeFromStart < 0 ? `in ${Math.abs(timeFromStart)}s` : `${timeFromStart}/${fadeDuration}s`}
  {/if}
</p>
