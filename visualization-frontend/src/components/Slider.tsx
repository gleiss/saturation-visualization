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

  componentDidUpdate(prevProps) {
    if (this.props.dag !== prevProps.dag) {
      this.setState({
        dag: this.props.dag,
        historyState: this.props.historyState
      });
    } else if (this.props.historyState !== prevProps.historyState) {
      this.setState({
        historyState: this.props.historyState
      });
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
