import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      historyState: props.historyState,
      nodeSelection: props.nodeSelection,
      onNodeSelectionChange: props.onNodeSelectionChange
    }
  }

  componentDidUpdate(prevProps) {
    const changedProps = {};

    if (this.props.dag !== prevProps.dag) {
      changedProps['dag'] = this.props.dag;
    }
    if (this.props.historyState !== prevProps.historyState) {
      changedProps['historyState'] = this.props.dag;
    }
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      changedProps['nodeSelection'] = this.props.dag;
    }

    if (Object.keys(changedProps).length) {
      this.setState(changedProps);
    }
  }

  render() {
    const {dag, historyState, nodeSelection, onNodeSelectionChange} = this.state;

    return (
      <main>
        <Graph
          dag={dag}
          historyState={historyState}
          nodeSelection={nodeSelection}
          onNodeSelectionChange={onNodeSelectionChange}
        />
        <Slider/>
      </main>
    );
  }
}
