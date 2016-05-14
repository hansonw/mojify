import React from 'react';
import promisify from '../promisify';

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
    const tabs = await promisify(chrome.tabs.query)({
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
