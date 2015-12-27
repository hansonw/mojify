'use strict';

/**
 * Automagically reload the extension when Webpack reports a change.
 */

var LIVERELOAD_HOST = 'localhost:';
var LIVERELOAD_PORT = 35729;
var ws;

function start() {
  ws = new WebSocket('ws://' + LIVERELOAD_HOST + LIVERELOAD_PORT + '/livereload');

  ws.onclose = function() {
    console.log('could not connect to livereload, retrying');
    setTimeout(start, 5000);
  };

  ws.onopen = function(event) {
    var hello = {
      command: 'hello',
      protocols: ['http://livereload.com/protocols/official-7']
    };

    ws.send(JSON.stringify(hello));
  };

  ws.onmessage = function(event) {
    if (event.data) {
      var data = JSON.parse(event.data);
      if (data && data.command === 'reload') {
        chrome.runtime.reload();
      }
    }
  };
}

start();
