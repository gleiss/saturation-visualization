import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';


export default class Aside extends React.Component {

  state = {};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    }
  }

  render() {
    const {nodeSelection} = this.state;

    return (
      <aside>
        <GraphMenu nodeSelection={nodeSelection}/>
        <NodeCard
          nodeSelection={nodeSelection}
          onSelectParents={this.props.onSelectParents}
          onSelectChildren={this.props.onSelectChildren}
          onFindCommonConsequences={this.props.onFindCommonConsequences}
        />
      </aside>
    );
  }

}
