import * as React from 'react';

import { Dag } from '../model/dag';
import Slider from './Slider';
import Graph from './Graph';


type Props = {
  dag: Dag,
  nodeSelection: number[],
  changedNodeEvent?: [number, number],
  historyLength: number,
  historyState: number,
  onNodeSelectionChange: (selection: number[]) => void,
  onHistoryStateChange: (newState: number) => void,
  onShowPassiveDag: (selectionId: number, currentTime: number) => void,
  onDismissPassiveDag: (selectedId: number) => void,
  onUpdateNodePosition: (nodeId: number, delta: [number, number]) => void
};
export default class Main extends React.Component<Props, {}> {

  render() {
    return (
      <main>
        <Graph
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
          changedNodeEvent={this.props.changedNodeEvent}
          historyState={this.props.historyState}
          onNodeSelectionChange={this.props.onNodeSelectionChange}
          onShowPassiveDag={this.props.onShowPassiveDag}
          onDismissPassiveDag={this.props.onDismissPassiveDag}
          onUpdateNodePosition={this.props.onUpdateNodePosition}
        />
        <Slider
          historyLength={this.props.historyLength}
          historyState={this.props.historyState}
          onHistoryStateChange={this.props.onHistoryStateChange}
          enabled={!this.props.dag.isPassiveDag}
        />
      </main>
    );
  }

}
