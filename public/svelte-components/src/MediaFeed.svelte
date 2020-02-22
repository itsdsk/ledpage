<script>
  import MediaFeedBlock from "./MediaFeedBlock.svelte";

  let mediaFeedObjects = [];
  socket.on("mediafeed", function(newMediaFeedObjects) {
    mediaFeedObjects = newMediaFeedObjects;
  });
</script>

{#each mediaFeedObjects as mediaFeedObject}
  <MediaFeedBlock {...mediaFeedObject} />
{/each}
