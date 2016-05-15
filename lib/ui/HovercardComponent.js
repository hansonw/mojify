// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import SymbolPicker from './SymbolPicker';

function isParent(parent, child) {
  let node = child;
  while (node instanceof Element && node !== parent) {
    node = node.parentNode;
  }
  return node === parent;
}

export default class HovercardComponent extends React.Component {
  static propTypes = {
    loading: React.PropTypes.bool,
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

  _onMouseDown(evt: Event) {
    const root = ReactDOM.findDOMNode(this);
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
          {this.props.symbols.map(
            (choices, i) => <SymbolPicker key={i} choices={choices} />,
          )}
        </div>
        <div className="dismiss" onClick={this.props.onDismiss}>
          &#10006;
        </div>
      </div>
    );
  }
}
