<script>
  export let directory;
  export let title;
  export let image;
  export let modified;
</script>

<div>
  <p>{title}</p>
  <img src={image} alt={title} />
</div>
