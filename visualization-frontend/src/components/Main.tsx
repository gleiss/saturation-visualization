import * as React from 'react';
import {DataSet, Edge, IdType, Network} from 'vis';

import NetworkNode from '../model/network/network-node';
import Slider from './Slider';
import Graph from './Graph';


type Props = {
  dag: any,
  nodeSelection: IdType[],
  historyLength: number,
  historyState: number,
  onNetworkChange: (network: Network, nodes: DataSet<NetworkNode>, edges: DataSet<Edge>) => void,
  onNodeSelectionChange: (selection: IdType[]) => void,
  onHistoryStateChange: (newState: number) => void
};
type State = {
  dag: any,
  nodeSelection: IdType[],
  historyLength: number,
  historyState: number
};
export default class Main extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      dag: props.dag,
      nodeSelection: props.nodeSelection,
      historyLength: props.historyState,
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
          historyLength={this.props.historyLength}
          historyState={this.props.historyState}
          onHistoryStateChange={this.props.onHistoryStateChange}
        />
      </main>
    );
  }

}
