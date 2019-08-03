import * as React from 'react';

import './Slider.css';


const icons = require('../resources/icons/all.svg') as string;

type Props = {
  dag: any,
  historyState: number,
  onHistoryStateChange,
};
type State = {
  dag: any,
  nodeSelection: number[],
  historyState: number
};
export default class Slider extends React.Component<Props, State> {

  state = {
    dag: {},
    nodeSelection: [],
    historyState: 0
  };
  private slider;

  render() {
    const {historyLength, historyState, onHistoryStateChange} = this.props;

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
            max={historyLength}
            value={historyState}
            onChange={() => onHistoryStateChange(parseInt(this.slider.value, 10))}
          />
        </section>

        <button disabled={historyState >= historyLength} onClick={() => onHistoryStateChange(historyState + 1)}>
          <svg viewBox="0 0 24 24" className="icon">
            <use xlinkHref={`${icons}#history-forward`}/>
          </svg>
        </button>

      </section>
    );
  }

}
