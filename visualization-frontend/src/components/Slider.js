import * as React from 'react';

import './Slider.css';
import icons from '../resources/icons/all.svg';


export default class Slider extends React.Component {

  state = {};

  componentDidUpdate(prevProps) {
    const changedProps = {};

    if (this.props.dag !== prevProps.dag) {
      changedProps.dag = this.props.dag;
    }
    if (this.props.historyState !== prevProps.historyState) {
      changedProps.historyState = this.props.historyState;
    }

    if (Object.keys(changedProps).length) {
      this.setState(changedProps);
    }
  }

  render() {
    const {dag, historyState, onHistoryStateChange} = this.props;
    const historyLength = Object.keys(dag.nodes).length;

    return (
      <section className="component-slider">

        <button disabled={historyState <= 0} onClick={() => onHistoryStateChange(historyState - 1)}>
          <svg viewBox="0 0 24 24" className="icon">
            <use xlinkHref={`${icons}#history-back`}/>
          </svg>
        </button>

        <section className="wrapper">
          <input
            ref={ref => this.slider = ref}
            type="range"
            min={0}
            max={historyLength - 1}
            value={historyState}
            onChange={() => onHistoryStateChange(this.slider.value)}
          />
        </section>

        <button disabled={historyState >= historyLength - 1} onClick={() => onHistoryStateChange(historyState + 1)}>
          <svg viewBox="0 0 24 24" className="icon">
            <use xlinkHref={`${icons}#history-forward`}/>
          </svg>
        </button>

      </section>
    );
  }

}
