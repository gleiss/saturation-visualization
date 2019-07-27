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
    const {
      onRenderParentsOnly,
      onRenderChildrenOnly,
      onSelectParents,
      onSelectChildren,
      onFindCommonConsequences
    } = this.props;

    return (
      <aside>
        <GraphMenu
          nodeSelection={nodeSelection}
          onRenderParentsOnly={onRenderParentsOnly}
          onRenderChildrenOnly={onRenderChildrenOnly}
        />
        <NodeCard
          nodeSelection={nodeSelection}
          onSelectParents={onSelectParents}
          onSelectChildren={onSelectChildren}
          onFindCommonConsequences={onFindCommonConsequences}
        />
      </aside>
    );
  }

}
