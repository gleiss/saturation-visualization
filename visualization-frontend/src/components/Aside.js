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
    } else if (this.props.nodes !== prevProps.nodes) {
      this.setState({
        nodes: this.props.nodes
      });
    }
  }

  render() {
    const {nodes, nodeSelection} = this.state;
    const {
      onUpdateNodeSelection,
      onUploadFile,
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
          onUploadFile={onUploadFile}
          onRenderParentsOnly={onRenderParentsOnly}
          onRenderChildrenOnly={onRenderChildrenOnly}
        />
        <NodeCard
          nodes={nodes}
          nodeSelection={nodeSelection}
          onUpdateNodeSelection={onUpdateNodeSelection}
          onSelectParents={onSelectParents}
          onSelectChildren={onSelectChildren}
          onFindCommonConsequences={onFindCommonConsequences}
        />
      </aside>
    );
  }

}
