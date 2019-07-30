import * as React from 'react';

import './Slider.css';
import icons from '../resources/icons/all.svg';


export default class Slider extends React.Component {

  render() {
    const {historyState, onHistoryStateChange} = this.props;
    
    const historyLength = Object.keys(this.props.dag.nodes).length;

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
