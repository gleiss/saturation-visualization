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

  componentDidUpdate(prevProps) {
    if (this.props.dag !== prevProps.dag) {
      this.setState({
        dag: this.props.dag,
        nodeSelection: this.props.nodeSelection,
        historyState: this.props.historyState
      });
    } else if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    } else if (this.props.historyState !== prevProps.historyState) {
      this.setState({
        historyState: this.props.historyState
      });
    }
  }

  render() {
    const {dag, nodeSelection, historyState} = this.state;
    const {onNetworkChange, onNodeSelectionChange, onHistoryStateChange} = this.props;

    return (
      <main>
        <Graph
          dag={dag}
          nodeSelection={nodeSelection}
          historyState={historyState}
          onNodeSelectionChange={onNodeSelectionChange}
          onNetworkChange={onNetworkChange}
        />
        <Slider
          dag={dag}
          historyState={historyState}
          onHistoryStateChange={onHistoryStateChange}
        />
      </main>
    );
  }

}
