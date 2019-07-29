import * as React from 'react';
import {DataSet} from 'vis';

import {NetworkNode} from '../model/networkNode';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';


type Props = {
  nodes: DataSet<NetworkNode>,
  nodeSelection: number[],
  versionCount: number,
  onUpdateNodeSelection,
  onUploadFile,
  onUndo,
  onRenderParentsOnly,
  onRenderChildrenOnly,
  onSelectParents,
  onSelectChildren,
  onFindCommonConsequences
};
type State = {
  nodes: DataSet<NetworkNode>,
  nodeSelection: number[],
  versionCount: number
};
export default class Aside extends React.Component<Props, State> {

  state = {nodes: [], nodeSelection: [], versionCount: 0};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    } else if (this.props.nodes !== prevProps.nodes) {
      this.setState({
        nodes: this.props.nodes
      });
    } else if (this.props.versionCount !== prevProps.versionCount) {
      this.setState({
        versionCount: this.props.versionCount
      });
    }
  }

  render() {
    const {nodes, nodeSelection, versionCount} = this.state;
    const {
      onUpdateNodeSelection,
      onUploadFile,
      onUndo,
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
          versionCount={versionCount}
          onUploadFile={onUploadFile}
          onUndo={onUndo}
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
        <NodeDetails
          nodes={nodes}
          nodeSelection={nodeSelection}
        />
      </aside>
    );
  }

}
