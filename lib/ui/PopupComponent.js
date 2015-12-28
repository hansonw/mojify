import React from 'react';

export default class PopupComponent extends React.Component {

  constructor() {
    super();
    this.state = {
      message: 'Loading...',
    };
  }

  componentDidMount() {
    this._getCurrentURI();
  }

  async _getCurrentURI() {
    const tabs = await chrome.promise.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tabs.length) {
      this.setState({message: `The current URL is ${tabs[0].url}`});
    }
  }

  render() {
    return <div>{this.state.message}</div>;
  }

}
