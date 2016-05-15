import React from 'react';
import ReactDOM from 'react-dom';

class Picker extends React.Component {
  static propTypes = {
    choices: React.PropTypes.arrayOf(React.PropTypes.object),
    onPick: React.PropTypes.func,
  };

  render(): React.Element {
    return (
      <div className="mojify-hovercard picker">
        {this.props.choices.map((choice, i) => {
          return (
            <div key={i} onClick={() => this.props.onPick(i)}>
              <div className="symbol">
                {choice.text}
              </div>
              <span className="percent">
                {Math.round(choice.confidence)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  }
}

// eslint-disable-next-line
export default class SymbolPicker extends React.Component {
  static propTypes = {
    choices: React.PropTypes.arrayOf(React.PropTypes.object),
  };

  constructor() {
    super();
    this.state = {
      showPicker: false,
      activeChoice: 0,
    };
    this.onClick = this.onClick.bind(this);
    this.onOuterClick = this.onOuterClick.bind(this);
    this.onPick = this.onPick.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.onOuterClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onOuterClick);
  }

  onClick() {
    this.setState({showPicker: true});
  }

  onOuterClick(evt) {
    if (this.state.showPicker) {
      if (!ReactDOM.findDOMNode(this).contains(evt.target)) {
        this.setState({showPicker: false});
      }
    }
  }

  onPick(index) {
    this.setState({showPicker: false, activeChoice: index});
  }

  render(): React.Element {
    let picker;
    if (this.state.showPicker) {
      picker = <Picker onPick={this.onPick} choices={this.props.choices} />;
    }
    return (
      <div className="symbol">
        <div onClick={this.onClick}>
          {this.props.choices[this.state.activeChoice].text}
        </div>
        {picker}
      </div>
    );
  }
}
