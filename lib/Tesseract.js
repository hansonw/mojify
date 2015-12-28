/**
 * A friendlier, fully-typed interface for the Tesseract library.
 * @flow
 */

type ProgressCallback = (progress: Object) => any;

type Handler = {
  progress: ProgressCallback;
  reject: (error: Object) => any;
  resolve: (data: Object) => any;
};

let nextID = 0;
const handlers: Map<number, Handler> = new Map();
let worker: ?Worker = null;

function getWorker(): Worker {
  if (worker == null) {
    worker = new Worker('static/worker.js');
    worker.postMessage({init: {mem: 16777216 * 10}});
    worker.onmessage = function(e: Object) {
      const handler = handlers.get(e.data.index);
      if (!handler) {
        return;
      }
      if (e.data.progress) {
        handler.progress(e.data.progress);
      } else if (e.data.err) {
        handler.reject(e.data.err);
      } else {
        handler.resolve(e.data.result);
      }
    };
  }
  return worker;
}

export function detect(
  image: ImageData,
  progress: ProgressCallback,
): Promise<Object> {
  return new Promise((resolve, reject) => {
    handlers.set(nextID, {progress, resolve, reject});
    getWorker().postMessage({index: nextID++, fun: 'detect', image});
  });
}

export function recognize(
  image: ImageData,
  options: Object,
  progress: ProgressCallback,
): Promise<Object> {
  const lang = options.lang || 'eng';
  return new Promise((resolve, reject) => {
    handlers.set(nextID, {progress, resolve, reject});
    getWorker().postMessage({
      index: nextID++,
      fun: 'recognize',
      image,
      lang,
      options,
    });
  });
}
