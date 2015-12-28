import React from 'react';
import PopupComponent from './ui/PopupComponent';
import ChromePromise from 'chrome-promise';

chrome.promise = new ChromePromise();

window.onload = () => {
  React.render(
    <PopupComponent />,
    document.getElementById('main')
  );
};
