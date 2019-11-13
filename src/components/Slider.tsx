import * as React from 'react';

import './Slider.css';


const icons = require('../resources/icons/all.svg') as string;

type Props = {
  historyLength: number,
  currentTime: number,
  onCurrentTimeChange: (newState: number) => void,
};
export default class Slider extends React.Component<Props, {}> {

  private slider = React.createRef<HTMLInputElement>();

  render() {
    const {historyLength, currentTime, onCurrentTimeChange} = this.props;

    return (
      <section className="component-slider">

        <button disabled={currentTime <= 0} onClick={() => onCurrentTimeChange(currentTime - 1)}>
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
            value={currentTime}
            onChange={() => onCurrentTimeChange(this.getSliderValue())}
          />
        </section>

        <button disabled={currentTime >= historyLength} onClick={() => onCurrentTimeChange(currentTime + 1)}>
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
