<script>
  export let name;
  export let value;
  export let min;
  export let max;
  export let step;

  let readonly = true;
  let changed = false;

  function handleChange(event) {
    var data = {
      name: name,
      value: value
    };
    //console.log(`sending updated ${name} value to server: ${JSON.stringify(data)}`);
    socket.emit("config/update", data);
    changed = true;
  }

  function handleBtnClick(event) {
    // get value mapped from 0.0 to 1.0
    var val = parseInt(event.target.innerHTML) / 100;
    // map from min to max
    val = val * Math.abs(max - min);
    val = min + val;
    // switch to int
    if (Number.isInteger(step)) {
      val = Math.round(val);
    }
    // update client and server
    value = val;
    handleChange();
  }
</script>

<style>
  label {
    display: block;
    text-align: left;
    font-size: 1em;
    font-weight: bold;
  }

  .config-input-save {
    display: flex;
  }

  .config-input-save > *:first-child {
    flex-grow: 2;
  }

  div {
    padding-top: 1em;
  }

  button {
    margin-left: 0.5em;
    width: 3.5em;
    padding: 0;
    text-align: center;
  }

  input {
    width: 4.5em;
  }
</style>

<div>
  <label for={name}>{name.toUpperCase()}:</label>
  <div class="config-input-save">
    <input
      id={name}
      type="number"
      bind:value
      {min}
      {max}
      {step}
      {readonly}
      on:click|once={() => (readonly = false)}
      on:change={handleChange} />
    <button disabled={readonly} on:click={handleBtnClick}>0</button>
    <button disabled={readonly} on:click={handleBtnClick}>33</button>
    <button disabled={readonly} on:click={handleBtnClick}>66</button>
    <button disabled={readonly} on:click={handleBtnClick}>100</button>
  </div>
</div>
