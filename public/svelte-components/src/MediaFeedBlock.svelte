<script>
  import { channelObjects } from './stores.js';
  export let directory;
  export let title;
  export let image;
  export let modified;
  export let channels;
  export let playcount;

  let channelsOpen = false;

  function handlePlay(event) {
    socket.emit("play", { directory: directory });
  }
  function handleEdit(event) {
    window.history.pushState(
      {
        page: "editor",
        disk: directory
      },
      directory,
      "?page=editor&disk=" + directory
    );
    refresh();
  }

  $: channelsList = $channelObjects.reduce((accumulator, currentValue) => {
    if (currentValue.channel_name) {
      accumulator.push({channel_name: currentValue.channel_name, added: channels.includes(currentValue.channel_name)})
    }
    return accumulator;
    }, []);
</script>

<div class="media__feed__block">
  <img src={image} alt="no image available" />
  <p style="text-align:center;">{title}</p>
  <div class="media__feed__block__overlay">
    <p>{(new Date(modified)).toUTCString()}</p>
    <button on:click={handlePlay}>Play</button>
    <button on:click={handleEdit}>Edit</button>
    <button on:click={() => channelsOpen = true}>Channels</button>
  </div>
  {#if channelsOpen}
    <div class="media__feed__block__overlay--playlists">
      <div>
        <input
          type=text
          placeholder="New channel name"
          on:change={e => socket.emit('addnewchannel', [directory, e.target.value])}
        >
      </div>
      {#each channelsList as channelObject}
        <div>
          <input
            type=checkbox
            checked={channelObject.added}
            on:change={e => socket.emit(e.target.checked ? 'createconnection' : 'deleteconnection', [directory, channelObject.channel_name])}
          > {channelObject.channel_name}
        </div>
      {/each}
      <button on:click={() => channelsOpen = false}>Close</button>
    </div>
  {/if}
</div>

<style>
  .media__feed__block {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .media__feed__block__overlay {
    opacity: 0;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .media__feed__block__overlay button {
    margin: 8px;
  }
  .media__feed__block__overlay:hover {
    opacity: 1;
  }

  .media__feed__block__overlay--playlists {
    opacity: 1;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  p {
    font-size: 0.7em;
    margin: 3px;
  }
  img {
    display: block;
    margin: auto;
    width: 100%;
  }
</style>