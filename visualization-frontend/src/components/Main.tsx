import * as React from 'react';
import {DataSet, Network} from 'vis';

import NetworkEdge from '../model/network/network-edge';
import NetworkNode from '../model/network/network-node';
import Dag from '../model/dag';
import Slider from './Slider';
import Graph from './Graph';


type Props = {
  dag: Dag,
  nodeSelection: number[],
  historyLength: number,
  historyState: number,
  onNetworkChange: (network: Network, nodes: DataSet<NetworkNode>, edges: DataSet<NetworkEdge>) => void,
  onNodeSelectionChange: (selection: number[]) => void,
  onHistoryStateChange: (newState: number) => void
};
export default class Main extends React.Component<Props, {}> {

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
