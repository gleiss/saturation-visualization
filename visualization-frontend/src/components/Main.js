import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      graph: props.graph,
      selection: props.selection
    }
  }

  render() {
    const {graph, selection} = this.state;

    return (
      <main>
        <Graph graph={graph} selection={selection}/>
        <Slider/>
      </main>
    );
  }
}
