import React from 'react';
import ReactDOM from 'react-dom';
import PopupComponent from './ui/PopupComponent';
import MojifyMain from './MojifyMain';

require('../static/popup.css');
require('../static/content.css');

// Load ourselves for the sample image!
new MojifyMain();

window.onload = () => {
  ReactDOM.render(
    <PopupComponent />,
    document.getElementById('main')
  );
};
