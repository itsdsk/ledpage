<script>
  import MediaFeedBlock from "./MediaFeedBlock.svelte";

  let mediaFeedObjects = [];
  socket.on("mediafeed", function(newMediaFeedObjects) {
    mediaFeedObjects = newMediaFeedObjects;
    updateSorting();
  });

  let channelObjects = [];
  socket.on("channellist", function(newChannelObjects) {
    channelObjects = newChannelObjects;
  });

  let selectedChannel = 'all media';
  let sortModes = [
      "Recently added",
      "Most viewed"
  ];
  let selectedSortMode = 'Recently added';

  function updateSorting() {
    if (selectedSortMode === 'Most viewed') {
      // sort playcount high to low
      mediaFeedObjects = mediaFeedObjects.sort((a, b) => b.playcount - a.playcount);
    } else if (selectedSortMode === 'Recently added') {
      // sort date new to old
      mediaFeedObjects = mediaFeedObjects.sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified));
    } else {
      console.log(`error in update sorting`);
    }
  }

</script>

<select bind:value={selectedChannel}>
  {#each channelObjects as channelObject}
    <option value={channelObject.channel_name || 'all media'}>
      {channelObject.channel_name || 'all media'} ({channelObject.count})
    </option>
  {/each}
</select>

<select bind:value={selectedSortMode} on:change="{updateSorting}">
  {#each sortModes as sortMode}
    <option value={sortMode}>
      {sortMode}
    </option>
  {/each}
</select>

<button on:click={() => socket.emit('autoplay', selectedChannel === 'all media' ? null : selectedChannel )}>Autoplay</button>

{#each mediaFeedObjects.filter(m => selectedChannel === 'all media' || m.channels.includes(selectedChannel)) as mediaFeedObject}
  <MediaFeedBlock {...mediaFeedObject} />
{/each}