import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      historyState: props.historyState
    }
  }

  render() {
    const {dag, historyState} = this.state;

    return (
      <main>
        <Graph dag={dag} historyState={historyState}/>
        <Slider/>
      </main>
    );
  }
}
