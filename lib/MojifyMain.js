// @flow

import invariant from 'assert';
import Rectangle from './Rectangle';

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
    const {clientX, clientY} = evt;
    const target = this._lastTarget;
    const coords = this._lastCoords;
    if (target && coords) {
      const rect = Rectangle.fromClientRect(target.getBoundingClientRect());
      if (rect.contains(clientX, clientY)) {
        this._triggerOCR(
          target,
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

  async _triggerOCR(img: HTMLImageElement, rect: Rectangle): Promise<void> {
    const response = await chrome.promise.runtime.sendMessage({
      command: 'recognize',
      src: img.src,
      rect,
    });
    // TODO: show response somewhere
    console.log(response);
  }

}
