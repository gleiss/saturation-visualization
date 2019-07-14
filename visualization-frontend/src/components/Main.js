import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      positions: props.positions,
      historyState: props.historyState
    }
  }

  render() {
    const {dag, positions, historyState} = this.state;

    return (
      <main>
        <Graph dag={dag} positions={positions} historyState={historyState}/>
        <Slider/>
      </main>
    );
  }
}
