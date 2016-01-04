// @flow
/* eslint no-var:0, one-var: 0, vars-on-top: 0, comma-dangle: 0 */

import pako from 'pako';
import tesseractCore from 'tesseract.js-core';
import {openDatabase} from './IndexedDB';

const DATA_REPO = 'https://github.com/hansonw/mojify-tessdata/raw/master/';
const DATA_DIR = 'tessdata';

// Emscripten wrapper
let Module;
// Actual API object
let base;
// Current request index
let curindex = 0;
const loadedLanguages = {};

function decode(data: string): Uint8Array {
  return new Uint8Array(data.split(',').map(
    function (c) {
      return c.charCodeAt(0);
    },
  ));
}

function initTesseract(memory: number) {
  Module = tesseractCore({
    TOTAL_MEMORY: memory, // must be a multiple of 10 megabytes
    TesseractProgress: (percent) => {
      postMessage({
        index: curindex,
        'progress': {
          'recognized': Math.max(0, (percent - 30) / 70),
        },
      });
    },
  });
  base = new Module.TessBaseAPI();
}

async function loadLanguage(lang, index) {
  if (loadedLanguages[lang] != null) {
    return true;
  }

  Module.FS_createPath('/', DATA_DIR, true, true);
  postMessage({
    index,
    'progress': {
      'loaded_lang_model': 0,
      cached: false,
      requesting: true
    }
  });

  const key = lang + '.traineddata';
  function createDataFile(data) {
    Module.FS_createDataFile('tessdata', key, data, true, false);
    loadedLanguages[lang] = true;
  }

  const db = await openDatabase();
  const cached = await db.getItem(key);
  if (cached) {
    createDataFile(decode(cached));
    return true;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${DATA_REPO}${lang}.traineddata.gz`, true);
    xhr.responseType = 'arraybuffer';
    xhr.onerror = () => reject(xhr);
    xhr.onprogress = function (e) {
      postMessage({
        index,
        'progress': {
          'loaded_lang_model': e.loaded / e.total,
          cached: false
        }
      });
    };
    xhr.onload = async function () {
      if (xhr.status === 200 || (xhr.status === 0 && xhr.response)) {
        postMessage({
          index,
          'progress': 'unzipping_lang_model'
        });

        const response = new Uint8Array(xhr.response);
        const data = pako.ungzip(response);

        postMessage({
          index,
          'progress': {
            'unzipped_lang_model': true,
            'lang_model_size': data.length
          }
        });

        createDataFile(data);
        // await db.setItem(key, encode(data));
        resolve(true);
      }
      reject(xhr);
    };
    xhr.send(null);
  });
}

function circularize(page) {
  page.paragraphs = [];
  page.lines = [];
  page.words = [];
  page.symbols = [];

  page.blocks.forEach(function (block) {
    block.page = page;

    block.lines = [];
    block.words = [];
    block.symbols = [];

    block.paragraphs.forEach(function (para) {
      para.block = block;
      para.page = page;

      para.words = [];
      para.symbols = [];

      para.lines.forEach(function (line) {
        line.paragraph = para;
        line.block = block;
        line.page = page;

        line.symbols = [];

        line.words.forEach(function (word) {
          word.line = line;
          word.paragraph = para;
          word.block = block;
          word.page = page;
          word.symbols.forEach(function (sym) {
            sym.word = word;
            sym.line = line;
            sym.paragraph = para;
            sym.block = block;
            sym.page = page;

            sym.line.symbols.push(sym);
            sym.paragraph.symbols.push(sym);
            sym.block.symbols.push(sym);
            sym.page.symbols.push(sym);
          });
          word.paragraph.words.push(word);
          word.block.words.push(word);
          word.page.words.push(word);
        });
        line.block.lines.push(line);
        line.page.lines.push(line);
      });
      para.page.paragraphs.push(para);
    });
  });
  return page;
}

function DumpLiterallyEverything() {
  var ri = base.GetIterator();
  var blocks = [];
  var block, para, textline, word, symbol;

  function enumToString(value, prefix) {
    return (Object.keys(Module)
         .filter(function (e) { return e.substr(0, prefix.length + 1) === prefix + '_'; })
         .filter(function (e) { return Module[e] === value; })
         .map(function (e) { return e.slice(prefix.length + 1); })[0]);
  }

  ri.Begin();
  do {
    if (ri.IsAtBeginningOf(Module.RIL_BLOCK)) {
      var poly = ri.BlockPolygon();
      var polygon = [];
      // BlockPolygon() returns null when automatic page segmentation is off
      if (Module.getPointer(poly) > 0) {
        var n = poly.get_n(),
          px = poly.get_x(),
          py = poly.get_y();
        for (var i = 0; i < n; i++) {
          polygon.push([px.getValue(i), py.getValue(i)]);
        }
        Module._ptaDestroy(Module.getPointer(poly));
      }

      block = {
        paragraphs: [],

        text: ri.GetUTF8Text(Module.RIL_BLOCK),
        confidence: ri.Confidence(Module.RIL_BLOCK),
        baseline: ri.getBaseline(Module.RIL_BLOCK),
        bbox: ri.getBoundingBox(Module.RIL_BLOCK),

        blocktype: enumToString(ri.BlockType(), 'PT'),
        polygon,
      };
      blocks.push(block);
    }
    if (ri.IsAtBeginningOf(Module.RIL_PARA)) {
      para = {
        lines: [],

        text: ri.GetUTF8Text(Module.RIL_PARA),
        confidence: ri.Confidence(Module.RIL_PARA),
        baseline: ri.getBaseline(Module.RIL_PARA),
        bbox: ri.getBoundingBox(Module.RIL_PARA),

        is_ltr: !!ri.ParagraphIsLtr(),
      };
      block.paragraphs.push(para);
    }
    if (ri.IsAtBeginningOf(Module.RIL_TEXTLINE)) {
      textline = {
        words: [],

        text: ri.GetUTF8Text(Module.RIL_TEXTLINE),
        confidence: ri.Confidence(Module.RIL_TEXTLINE),
        baseline: ri.getBaseline(Module.RIL_TEXTLINE),
        bbox: ri.getBoundingBox(Module.RIL_TEXTLINE)
      };
      para.lines.push(textline);
    }
    if (ri.IsAtBeginningOf(Module.RIL_WORD)) {
      var fontInfo = ri.getWordFontAttributes(),
        wordDir = ri.WordDirection();
      word = {
        symbols: [],
        choices: [],

        text: ri.GetUTF8Text(Module.RIL_WORD),
        confidence: ri.Confidence(Module.RIL_WORD),
        baseline: ri.getBaseline(Module.RIL_WORD),
        bbox: ri.getBoundingBox(Module.RIL_WORD),

        is_numeric: !!ri.WordIsNumeric(),
        in_dictionary: !!ri.WordIsFromDictionary(),
        direction: enumToString(wordDir, 'DIR'),
        language: ri.WordRecognitionLanguage(),

        is_bold: fontInfo.is_bold,
        is_italic: fontInfo.is_italic,
        is_underlined: fontInfo.is_underlined,
        is_monospace: fontInfo.is_monospace,
        is_serif: fontInfo.is_serif,
        is_smallcaps: fontInfo.is_smallcaps,
        font_size: fontInfo.pointsize,
        font_id: fontInfo.font_id,
        font_name: fontInfo.font_name,
      };
      var wc = new Module.WordChoiceIterator(ri);
      do {
        word.choices.push({
          text: wc.GetUTF8Text(),
          confidence: wc.Confidence()
        });
      } while (wc.Next());
      Module.destroy(wc);
      textline.words.push(word);
    }

    var image = null;
    // var pix = ri.GetBinaryImage(Module.RIL_SYMBOL)
    // var image = pix2array(pix);
    // // for some reason it seems that things stop working if you destroy pics
    // Module._pixDestroy(Module.getPointer(pix));
    if (ri.IsAtBeginningOf(Module.RIL_SYMBOL)) {
      symbol = {
        choices: [],
        image,

        text: ri.GetUTF8Text(Module.RIL_SYMBOL),
        confidence: ri.Confidence(Module.RIL_SYMBOL),
        baseline: ri.getBaseline(Module.RIL_SYMBOL),
        bbox: ri.getBoundingBox(Module.RIL_SYMBOL),

        is_superscript: !!ri.SymbolIsSuperscript(),
        is_subscript: !!ri.SymbolIsSubscript(),
        is_dropcap: !!ri.SymbolIsDropcap(),
      };
      word.symbols.push(symbol);
      var ci = new Module.ChoiceIterator(ri);
      do {
        symbol.choices.push({
          text: ci.GetUTF8Text(),
          confidence: ci.Confidence()
        });
      } while (ci.Next());
      Module.destroy(ci);
    }
  } while (ri.Next(Module.RIL_SYMBOL));
  Module.destroy(ri);

  return {
    text: base.GetUTF8Text(),
    html: base.GetHOCRText(),
    confidence: base.MeanTextConf(),
    blocks,
    psm: enumToString(base.GetPageSegMode(), 'PSM'),
    oem: enumToString(base.oem(), 'OEM'),
    version: base.Version(),
  };
}

function desaturate(image: ImageData) {
  const {data: src, width, height} = image;
  const dst = new Uint8Array(width * height);
  const srcLength = src.length | 0;
  const srcLength16 = (srcLength - 16) | 0;

  var i, j;
  for (i = 0, j = 0; i <= srcLength16; i += 16, j += 4) {
    // convert to grayscale 4 pixels at a time; eveything with alpha get put in front of 50% gray
    dst[j] = (((src[i] * 77 + src[i + 1] * 151 + src[i + 2] * 28) * src[i + 3]) + ((255 - src[i + 3]) << 15) + 32768) >> 16;
    dst[j + 1] = (((src[i + 4] * 77 + src[i + 5] * 151 + src[i + 6] * 28) * src[i + 7]) + ((255 - src[i + 7]) << 15) + 32768) >> 16;
    dst[j + 2] = (((src[i + 8] * 77 + src[i + 9] * 151 + src[i + 10] * 28) * src[i + 11]) + ((255 - src[i + 11]) << 15) + 32768) >> 16;
    dst[j + 3] = (((src[i + 12] * 77 + src[i + 13] * 151 + src[i + 14] * 28) * src[i + 15]) + ((255 - src[i + 15]) << 15) + 32768) >> 16;
  }
  for (; i < srcLength; i += 4, ++j) {
    dst[j] = (((src[i] * 77 + src[i + 1] * 151 + src[i + 2] * 28) * src[i + 3]) + ((255 - src[i + 3]) << 15) + 32768) >> 16;
  }
  return dst;
}

async function recognize(index, image, lang, options) {
  await loadLanguage(lang, index);

  const {width, height} = image;
  const desaturated = desaturate(image);
  var ptr = Module.allocate(desaturated, 'i8', Module.ALLOC_NORMAL);

  curindex = index;
  base.Init(null, lang);

  postMessage({
    index,
    progress: {
      initialized_with_lang: true,
      lang,
    }
  });

  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      base.SetVariable(option, options[option]);
      postMessage({
        index,
        'progress': {
          'set_variable': {
            variable: option,
            value: options[option]
          }
        }
      });
    }
  }


  base.SetImage(Module.wrapPointer(ptr), width, height, 1, width);
  base.SetRectangle(0, 0, width, height);
  // base.GetUTF8Text()
  base.Recognize(null);
  var everything = circularize(DumpLiterallyEverything());
  base.End();
  Module._free(ptr);
  return everything;
}

async function detect(index, image) {
  await loadLanguage('osd', index);

  var width = image.width, height = image.height;
  const desaturated = desaturate(image);
  var ptr = Module.allocate(desaturated, 'i8', Module.ALLOC_NORMAL);

  curindex = index;
  base.Init(null, 'osd');
  base.SetPageSegMode(Module.PSM_OSD_ONLY);

  base.SetImage(Module.wrapPointer(ptr), width, height, 1, width);
  base.SetRectangle(0, 0, width, height);

  var results = new Module.OSResults();
  var success = base.DetectOS(results);
  if (!success) {
    base.End();
    Module._free(ptr);
    throw new Error('failed to detect os');
  } else {
    var charset = results.get_unicharset();
    var best = results.get_best_result();
    var oid = best.get_orientation_id(),
      sid = best.get_script_id();

    const result = {
      tesseract_script_id: sid,
      script: charset.get_script_from_script_id(sid),
      script_confidence: best.get_sconfidence(),
      orientation_degrees: [0, 270, 180, 90][oid],
      orientation_confidence: best.get_oconfidence()
    };

    base.End();
    Module._free(ptr);
    return result;
  }
}

/* global onmessage: true */
onmessage = (e: Object) => {
  const {init, fun, index, image, lang, options} = e.data;
  if (init != null) {
    initTesseract(init.mem);
  } else if (fun === 'recognize') {
    recognize(index, image, lang, options)
      .then((result) => postMessage({index, result}))
      .catch((err) => postMessage({index, err: err.message}));
  } else if (fun === 'detect') {
    detect(index, image)
      .then((result) => postMessage({index, result}))
      .catch((err) => postMessage({index, err: err.message}));
  }
};
