<script>
  import { channelObjects } from "./client_data.js";
  export let directory;
  export let title;
  export let image;
  export let modified;
  export let channels;
  export let playcount;
  export let source;

  let channelsOpen = false;

  function handlePlay(event) {
    socket.emit("play", { directory: directory });
  }

  $: channelsList = $channelObjects.reduce((accumulator, currentValue) => {
    if (currentValue.channel_name) {
      accumulator.push({
        channel_name: currentValue.channel_name,
        added: channels.includes(currentValue.channel_name)
      });
    }
    return accumulator;
  }, []);

  function renameMedia(e) {
    // check if user pressed ENTER
    if (e.inputType == "insertParagraph") {
      e.preventDefault();
      // remove line breaks from title
      var newTitle = e.target.innerText.replace(/(\r\n|\n|\r)/gm, "");
      e.target.innerText = newTitle;
      // check if title has changed
      if (newTitle !== title) {
        // construct msg to send server
        var renameMsg = {
          directory: directory,
          newName: newTitle
        };
        console.log(`renaming media ${title} to ${newTitle}`);
        // send to server
        socket.emit("renamemedia", renameMsg);
      } else {
        console.log(`error changing title of ${newTitle}: no change`);
      }
    }
  }
</script>

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
    background-color: rgba(255, 255, 255, 0.25);
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
    background-color: rgba(255, 255, 255, 1);
    border: 1px solid #cdcdcd;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: stretch;
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
  .sub-title:after {
    content: attr(data-title);
    color: rgba(0, 0, 0, 0.75);
  }
  .media__feed__block:hover .sub-title:after {
    content: attr(data-date);
    color: black;
  }

  .media__feed__block__overlay--playlists > * {
    margin: 2px 10px;
  }

  .title__editable {
    border-bottom: 1px solid black;
  }

  .overlay--channels {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 50%;
  }

  .overlay--delete {
    float: right;
    opacity: 0.5;
  }

  .overlay--delete:hover {
    text-decoration: underline;
    opacity: 1;
  }

  .overlay--source {
    font-size: 0.65em;
  }

  .overlay--new-channel-input {
    width: 100%;
    box-sizing: border-box;
  }
</style>

<div class="media__feed__block">
  <img src={image} alt="no image available" />
  <p
    class="sub-title"
    style="text-align:center;"
    data-title={title}
    data-date={new Date(modified).toUTCString()} />
  <div class="media__feed__block__overlay">
    <button on:click={handlePlay}>Play</button>
    <button on:click={() => (channelsOpen = true)}>Info</button>
  </div>
  {#if channelsOpen}
    <div class="media__feed__block__overlay--playlists">
      <div class="overlay--source">
        View
        <a
          href={directory.startsWith('http') ? directory : `/media/${directory}/index.html`}>
          saved
        </a>
        /
        <a href={source}>
          source
        </a>
        <span
          class="overlay--delete"
          on:click={() => {
            if (window.confirm(`Delete '${title}'?`)) socket.emit('deletemedia', directory);
          }}>
          Delete
        </span>
      </div>
      <div class="title">
        <div
          class="title__editable"
          on:input={renameMedia}
          contenteditable="true"
          spellcheck="false">
          {title}
        </div>
      </div>
      <div class="overlay--channels">
        <input
          type="text"
          placeholder="New channel"
          class="overlay--new-channel-input"
          on:change={e => socket.emit('addnewchannel', [
              directory,
              e.target.value
            ])} />
        {#each channelsList as channelObject}
          <div>
            <input
              type="checkbox"
              checked={channelObject.added}
              on:change={e => socket.emit(
                  e.target.checked ? 'createconnection' : 'deleteconnection',
                  [directory, channelObject.channel_name]
                )} />
            {channelObject.channel_name}
          </div>
        {/each}
      </div>
      <button on:click={() => (channelsOpen = false)}>Close</button>
    </div>
  {/if}
</div>
