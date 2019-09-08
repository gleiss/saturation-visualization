import * as React from 'react';

import { Dag } from '../model/dag';
import Slider from './Slider';
import Graph from './Graph';


type Props = {
  dag: Dag,
  nodeSelection: number[],
  historyLength: number,
  historyState: number,
  onNodeSelectionChange: (selection: number[]) => void,
  onHistoryStateChange: (newState: number) => void,
  onShowPassiveDag: (selection: Set<number>, currentTime: number) => void,
  onDismissPassiveDag: () => void
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
          onShowPassiveDag={this.props.onShowPassiveDag}
          onDismissPassiveDag={this.props.onDismissPassiveDag}
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
