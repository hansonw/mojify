import React from 'react';
import ReactDOM from 'react-dom';
import PopupComponent from './ui/PopupComponent';
import ChromePromise from 'chrome-promise';

chrome.promise = new ChromePromise();

window.onload = () => {
  ReactDOM.render(
    <PopupComponent />,
    document.getElementById('main')
  );
};
