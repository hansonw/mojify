// @flow

import invariant from 'assert';
import React from 'react';
import ReactDOM from 'react-dom';
import Rectangle from './Rectangle';
import HovercardComponent from './ui/HovercardComponent';
import promisify from './promisify';

// Selection must be at least this big to trigger OCR.
const MIN_SIZE = 10;

function dismount(node: Element) {
  ReactDOM.unmountComponentAtNode(node);
  node.remove();
}

export default class MojifyMain {

  _lastTarget: ?HTMLImageElement;
  _lastCoords: ?{
    clientX: number,
    clientY: number,
    pageX: number,
    pageY: number,
  };
  _selectionElement: ?HTMLElement;

  constructor() {
    this._lastTarget = null;
    this._lastCoords = null;

    window.onmousedown = this.onMouseDown.bind(this);
    window.onmousemove = this.onMouseMove.bind(this);
    window.onmouseup = this.onMouseUp.bind(this);
  }

  onMouseDown(evt: MouseEvent) {
    if (!evt.altKey) {
      return;
    }

    // $FlowIssue: not defined in MouseEvent
    const {target, clientX, clientY, pageX, pageY} = evt;
    if (target.tagName === 'IMG') {
      invariant(target instanceof HTMLImageElement);
      this._lastTarget = target;
      this._lastCoords = {clientX, clientY, pageX, pageY};
      evt.preventDefault();
      const elem = (document.createElement('div'): HTMLElement);
      elem.className = 'mojify-selector';
      this._selectionElement = elem;
      document.body.appendChild(elem);
    }
  }

  onMouseMove(evt: MouseEvent) {
    const elem = this._selectionElement;
    if (elem != null && this._lastCoords != null) {
      // $FlowIssue: not defined in MouseEvent
      const {pageX, pageY} = evt;
      const {pageX: x, pageY: y} = this._lastCoords;
      const rect = new Rectangle(pageX, pageY, x, y);
      elem.style.left = `${rect.x1}px`;
      elem.style.top = `${rect.y1}px`;
      elem.style.width = `${rect.width()}px`;
      elem.style.height = `${rect.height()}px`;
    }
  }

  onMouseUp(evt: MouseEvent) {
    // $FlowIssue: not defined in MouseEvent
    const {clientX, clientY, pageX, pageY} = evt;
    const target = this._lastTarget;
    const coords = this._lastCoords;
    if (target && coords) {
      const rect = Rectangle.fromClientRect(target.getBoundingClientRect());
      if (rect.contains(clientX, clientY)) {
        this._triggerOCR(
          target,
          pageX,
          pageY,
          new Rectangle(
            coords.clientX - rect.x1,
            coords.clientY - rect.y1,
            clientX - rect.x1,
            clientY - rect.y1,
          ),
        );
      }

      this._lastTarget = null;
      this._lastCoords = null;
    }
    if (this._selectionElement) {
      this._selectionElement.remove();
      this._selectionElement = null;
    }
  }

  async _triggerOCR(
    img: HTMLImageElement,
    pageX: number,
    pageY: number,
    rect: Rectangle,
  ): Promise<void> {
    if (rect.width() < MIN_SIZE || rect.height() < MIN_SIZE) {
      return;
    }

    const root = document.createElement('div');
    root.className = 'mojify-hovercard';
    if (pageX - document.body.scrollLeft < window.innerHeight / 2) {
      root.style.left = `${pageX}px`;
    } else {
      root.style.right = `${document.body.scrollWidth - pageX}px`;
    }
    if (pageY - document.body.scrollTop < window.innerWidth / 2) {
      root.style.top = `${pageY}px`;
    } else {
      root.style.bottom = `${document.body.scrollHeight - pageY}px`;
    }
    document.body.appendChild(root);

    // Display an initial loading state.
    ReactDOM.render(
      <HovercardComponent loading />,
      root,
    );

    let response;
    try {
      response = await promisify(chrome.runtime.sendMessage)({
        command: 'recognize',
        src: img.src,
        rect,
      });
    } catch (e) {
      console.log('mojify: error getting results', e);
      dismount(root);
      return;
    }

    // TODO: show error status
    if (response.result.length === 0) {
      dismount(root);
      return;
    }

    ReactDOM.render(
      <HovercardComponent
        onDismiss={() => dismount(root)}
        symbols={response.result}
      />,
      root,
    );
  }

}
