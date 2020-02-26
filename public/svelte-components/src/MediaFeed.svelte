<script>
  import MediaFeedBlock from "./MediaFeedBlock.svelte";

  let mediaFeedObjects = [];
  socket.on("mediafeed", function(newMediaFeedObjects) {
    mediaFeedObjects = newMediaFeedObjects;
  });

  let channelObjects = [];
  socket.on("channellist", function(newChannelObjects) {
    channelObjects = newChannelObjects;
  });
</script>

<p>
  {#each channelObjects as channelObject}
    <span>
      {channelObject.channel_name || 'all media'} ({channelObject.count})
    </span>
  {/each}
</p>

{#each mediaFeedObjects as mediaFeedObject}
  <MediaFeedBlock {...mediaFeedObject} />
{/each}
