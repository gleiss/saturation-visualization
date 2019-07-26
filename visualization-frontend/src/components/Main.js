import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      nodeSelection: props.nodeSelection
    }
  }

  componentDidUpdate(prevProps) {
    const changedProps = {};

    if (this.props.dag !== prevProps.dag) {
      changedProps['dag'] = this.props.dag;
    }
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      changedProps['nodeSelection'] = this.props.nodeSelection;
    }

    if (Object.keys(changedProps).length) {
      this.setState(changedProps);
    }
  }

  render() {
    const {dag, nodeSelection} = this.state;

    return (
      <main>
        <Graph
          dag={dag}
          nodeSelection={nodeSelection}
          onNodeSelectionChange={this.props.onNodeSelectionChange}
          onNetworkChange={this.props.onNetworkChange}
        />
        <Slider/>
      </main>
    );
  }
}
