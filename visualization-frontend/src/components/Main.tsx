import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


type Props = {
  dag: any,
  nodeSelection: number[],
  historyState: number,
  onNetworkChange,
  onNodeSelectionChange,
  onHistoryStateChange
};
type State = {
  dag: any,
  nodeSelection: number[],
  historyState: number
};
export default class Main extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      nodeSelection: props.nodeSelection,
      historyState: props.historyState
    }
  }

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
          historyLength={this.props.historyLength}
          historyState={this.props.historyState}
          onHistoryStateChange={this.props.onHistoryStateChange}
        />
      </main>
    );
  }

}
