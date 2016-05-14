export default function promisify(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, resp => {
        if (resp == null) {
          return reject(chrome.runtime.lastError);
        }
        return resolve(resp);
      });
    });
  };
}
