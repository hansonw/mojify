import React from 'react';

// eslint-disable-next-line
export default class PopupComponent extends React.Component {

  render() {
    const details = chrome.app.getDetails();
    return (
      <div>
        <h2>Mojify v{details.version}</h2>
        {details.description}
        <p>
          Alternatively, hold Alt and click+drag to select a region of text
          in an image. Try it out below!
        </p>
        <img
          alt="helloworld"
          src="helloworld.png"
        />
      </div>
    );
  }

}
