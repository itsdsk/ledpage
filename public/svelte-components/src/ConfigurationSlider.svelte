<script>
  export let name;
  export let value;
  export let min;
  export let max;
  export let step;

  let readonly = true;
  let changed = false;

  function handleChange (event) {
    var data = {
      name: name,
      value: value
    };
    //console.log(`sending updated ${name} value to server: ${JSON.stringify(data)}`);
    socket.emit("config/update", data);
    changed = true;
  }
</script>

<label>
  <span>{name.toUpperCase()}:</span>
  <input type="number" bind:value {min} {max} {step} {readonly} on:click|once="{() => readonly = false}" on:change={handleChange} />
{#if changed}
  <button disabled={!changed} on:click={() => socket.emit('saveconfig')}>Save</button>
{/if}
</label>


<style>
  label, span {
    display: block;
    text-align: left;
  }

  span {
    font-size: 1em;
    font-weight: bold;
  }
</style>