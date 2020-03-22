<script>
  import MediaFeedBlock from "./MediaFeedBlock.svelte";
	import { slide } from 'svelte/transition';
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

<div class="media-main">

  <div class="media media__header">

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

  </div>

  <div class="media__feed">

    {#each mediaFeedObjects.filter(m => selectedChannel === 'all media' || m.channels.includes(selectedChannel)) as mediaFeedObject}
      <div class="media" transition:slide>
        <MediaFeedBlock {...mediaFeedObject} {channelObjects} />
      </div>
    {/each}

  </div>

</div>

<style>
  .media {
    margin: 8px;
  }

  .media__header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .media-main {
    background: lightgray;
  }

  .media__feed {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(250px, 1fr));
  }
</style>