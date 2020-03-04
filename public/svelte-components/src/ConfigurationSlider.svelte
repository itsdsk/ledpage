<script>
  export let name;
  export let value;
  export let min;
  export let max;
  export let step;
</script>

<p>{name} {value}</p>
<input type="range" bind:value {min} {max} {step} />
