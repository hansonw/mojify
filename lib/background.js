import invariant from 'assert';
import LanguageConfig from './LanguageConfig';
import Rectangle from './Rectangle';
import {recognize} from './Tesseract';

function getImageData(
  src: string,
  rect: Rectangle,
): Promise<ImageData> {
  return new Promise((resolve) => {
    const image = new Image();
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = src;
    image.onload = () => {
      const c = document.createElement('canvas');
      invariant(c instanceof HTMLCanvasElement);
      c.width = rect.width();
      c.height = rect.height();

      const ctx = c.getContext('2d');
      ctx.drawImage(
        image,
        rect.x1, rect.y1, rect.width(), rect.height(),
        0, 0, rect.width(), rect.height(),
      );
      resolve(ctx.getImageData(0, 0, rect.width(), rect.height()));
    };
  });
}

async function handleRecognize(src, rect, callback) {
  const image = await getImageData(
    src,
    new Rectangle(rect.x1, rect.y1, rect.x2, rect.y2),
  );
  const result = await recognize(image, LanguageConfig.CHI_TRA, (msg) => {
    // TODO: show progress somewhere
    console.log(msg);
  });
  callback({result: result.symbols.map(s => s.choices)});
}

window.onload = () => {
  if (!chrome.runtime.onMessage) {
    // Only really necessary for debugging.
    console.log('Reload failed.. trying again');
    window.location.reload();
  } else {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const {command, src, rect} = request;
      if (command === 'recognize') {
        handleRecognize(src, rect, sendResponse);
        return true; // async
      }
    });
  }
};

if (__DEV__) {
  const liveReload = require('./LiveReload');
  liveReload();
}
