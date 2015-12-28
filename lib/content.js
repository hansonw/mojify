import MojifyMain from './MojifyMain';
import ChromePromise from 'chrome-promise';

require('../static/content.css');

chrome.promise = new ChromePromise();
new MojifyMain();
