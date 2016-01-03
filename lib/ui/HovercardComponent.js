// @flow

import React from 'react';

function isParent(parent, child) {
  let node = child;
  while (node instanceof Element && node !== parent) {
    node = node.parentNode;
  }
  return node === parent;
}

export default class HovercardComponent extends React.Component {
  static propTypes = {
    loading: React.PropTypes.boolean,
    onDismiss: React.PropTypes.func,
    symbols: React.PropTypes.array,
  };

  static defaultProps = {
    symbols: [],
  };

  constructor(props: Object) {
    super(props);
    this._onMouseDown = this._onMouseDown.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this._onMouseDown);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this._onMouseDown);
  }

  _onMouseDown(evt: MouseEvent) {
    const root = React.findDOMNode(this);
    if (this.props.onDismiss && !isParent(root.parentNode, evt.target)) {
      this.props.onDismiss();
    }
  }

  render(): Object {
    if (this.props.loading) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <div className="results">
          {this.props.symbols.map(sym => {
            return (
              <div className="symbol">
                {sym.map(choice => {
                  return <span>{choice.text}</span>;
                })}
              </div>
            );
          })}
        </div>
        <div className="dismiss" onClick={this.props.onDismiss}>
          &#10006;
        </div>
      </div>
    );
  }
}
