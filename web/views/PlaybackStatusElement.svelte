<script>
  export let title = false;
  export let directory = "";
  export let startTime = 0;
  export let fadeDuration = false;
  export let timeFromStart = false;

  $: isLiveURL = title === "<Live URL>";
</script>

<span>
  {#if title}
    {#if isLiveURL}{directory}{:else}{title}{/if}
  {:else}Nothing...{/if}
</span>
