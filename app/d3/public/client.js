// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  console.log('hello world :o');
  
  //$.get('/setup/count', function(dreams) {
  //  dreams.forEach(function(dream) {
  //    $('<li></li>').text(dream).appendTo('ul#dreams');
  //  });
  //});

  $.get('/setup/count', function(numleds) {
    numleds.forEach(function(trynumleds) {
      $('<li></li>').text(trynumleds).appendTo('ul#numleds');
    });
  });


  $('form').submit(function(event) {
    event.preventDefault();
    //var dream = $('input').val();
    var trynumleds = $('input').val();
    //$.post('/setup/count?' + $.param({dream: dream}), function() {
    $.post('/setup/count?' + $.param({trynumleds: trynumleds}), function() {
      $('<li></li>').text(trynumleds).appendTo('ul#numleds');
      $('input').val('');
      $('input').focus();
      console.log('client: POST received ' + trynumleds);
      console.log('client: set numleds ' + numleds);
    });
  });

});

