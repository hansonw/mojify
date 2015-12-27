/**
 * Automagically reload the extension when Webpack reports a change.
 */

if (__DEV__) {
  const LIVERELOAD_HOST = 'localhost:';
  const LIVERELOAD_PORT = 35729;
  let ws;

  const start = () => {
    ws = new WebSocket('ws://' + LIVERELOAD_HOST + LIVERELOAD_PORT + '/livereload');

    ws.onclose = () => {
      console.log('could not connect to livereload, retrying');
      setTimeout(start, 5000);
    };

    ws.onopen = () => {
      const hello = {
        command: 'hello',
        protocols: ['http://livereload.com/protocols/official-7'],
      };

      ws.send(JSON.stringify(hello));
    };

    ws.onmessage = (event) => {
      if (event.data) {
        const data = JSON.parse(event.data);
        if (data && data.command === 'reload') {
          chrome.runtime.reload();
        }
      }
    };
  };

  start();
}
