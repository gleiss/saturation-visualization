import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {

  render() {
    return (
      <main>
        <Graph
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
          historyState={this.props.historyState}
          onNodeSelectionChange={this.props.onNodeSelectionChange}
          onNetworkChange={this.props.onNetworkChange}
        />
        <Slider
          dag={this.props.dag}
          historyState={this.props.historyState}
          onHistoryStateChange={this.props.onHistoryStateChange}
        />
      </main>
    );
  }
}
