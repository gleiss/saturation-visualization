import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      nodeSelection: props.nodeSelection,
      historyState: props.historyState
    }
  }

  componentDidUpdate(prevProps) {
    const changedProps = {};

    if (this.props.dag !== prevProps.dag) {
      changedProps.dag = this.props.dag;
    }
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      changedProps.nodeSelection = this.props.nodeSelection;
    }
    if (this.props.historyState !== prevProps.historyState) {
      changedProps.historyState = this.props.historyState;
    }

    if (Object.keys(changedProps).length) {
      this.setState(changedProps);
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
