<script>
  export let directory;
  export let title;
  export let image;
  export let modified;

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
</script>

<div>
  <p>{title}</p>
  <img src={image} alt={title} />
  <button on:click={handlePlay}>Play</button>
  <button on:click={handleEdit}>Edit</button>
</div>
