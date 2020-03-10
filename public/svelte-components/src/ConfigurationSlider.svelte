<script>
  export let name;
  export let value;
  export let min;
  export let max;
  export let step;

  function handleChange (event) {
    var data = {
      name: name,
      value: value
    };
    //console.log(`sending updated ${name} value to server: ${JSON.stringify(data)}`);
    socket.emit("config/update", data);
  }
</script>

<p>{name} {value}</p>
<input type="range" bind:value {min} {max} {step} on:change={handleChange} />
