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

  let selectedChannel = 'all media';
</script>

<select bind:value={selectedChannel} on:change="{() => console.log(selectedChannel)}">
  {#each channelObjects as channelObject}
    <option value={channelObject.channel_name || 'all media'}>
      {channelObject.channel_name || 'all media'} ({channelObject.count})
    </option>
  {/each}
</select>
{#each mediaFeedObjects.filter(m => selectedChannel === 'all media' || m.channels.includes(selectedChannel)) as mediaFeedObject}
  <p>{mediaFeedObject.title} ({JSON.stringify(mediaFeedObject.channels)})</p>
{/each}

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
