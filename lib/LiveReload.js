/**
 * Automagically reload the extension when Webpack reports a change.
 */

const LIVERELOAD_HOST = 'localhost:';
const LIVERELOAD_PORT = 35729;
let ws;

export default function LiveReload() {
  ws = new WebSocket('ws://' + LIVERELOAD_HOST + LIVERELOAD_PORT + '/livereload');

  ws.onclose = () => {
    console.log('could not connect to livereload, retrying');
    setTimeout(LiveReload, 5000);
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
}
