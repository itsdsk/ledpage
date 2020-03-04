<script>
  socket.on("configuration", function(conf) {
    // test
    console.log(JSON.stringify(conf, null, 2));
  });
</script>
