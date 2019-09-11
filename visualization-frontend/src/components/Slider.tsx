import * as React from 'react';

import './Slider.css';


const icons = require('../resources/icons/all.svg') as string;

type Props = {
  historyLength: number,
  historyState: number,
  onHistoryStateChange: (newState: number) => void,
  enabled: boolean
};
export default class Slider extends React.Component<Props, {}> {

  private slider = React.createRef<HTMLInputElement>();

  render() {
    const {historyLength, historyState, onHistoryStateChange} = this.props;

    return (
      <section className="component-slider">

        <button disabled={!this.props.enabled || historyState <= 0} onClick={() => onHistoryStateChange(historyState - 1)}>
          <svg viewBox="0 0 24 24" className="icon">
            <use xlinkHref={`${icons}#history-back`}/>
          </svg>
        </button>

        <section className="wrapper">
          <input
            ref={this.slider}
            type="range"
            min={0}
            max={historyLength}
            value={historyState}
            disabled={!this.props.enabled}
            onChange={() => onHistoryStateChange(this.getSliderValue())}
          />
        </section>

        <button disabled={!this.props.enabled || historyState >= historyLength} onClick={() => onHistoryStateChange(historyState + 1)}>
          <svg viewBox="0 0 24 24" className="icon">
            <use xlinkHref={`${icons}#history-forward`}/>
          </svg>
        </button>

      </section>
    );
  }

  // HELPERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  getSliderValue(): number {
    return this.slider.current ? parseInt(this.slider.current.value, 10) : 0;
  }

}
