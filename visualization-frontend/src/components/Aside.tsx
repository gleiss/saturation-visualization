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

  render() {
    return (
      <aside>
        <GraphMenu
          nodeSelection={this.props.nodeSelection}
          versionCount={this.props.versionCount}
          onUploadFile={this.props.onUploadFile}
          onUndo={this.props.onUndo}
          onRenderParentsOnly={this.props.onRenderParentsOnly}
          onRenderChildrenOnly={this.props.onRenderChildrenOnly}
        />
        <NodeCard
          nodes={this.props.nodes}
          nodeSelection={this.props.nodeSelection}
          onUpdateNodeSelection={this.props.onUpdateNodeSelection}
          onSelectParents={this.props.onSelectParents}
          onSelectChildren={this.props.onSelectChildren}
          onFindCommonConsequences={this.props.onFindCommonConsequences}
        />
        <NodeDetails
          nodes={this.props.nodes}
          nodeSelection={this.props.nodeSelection}
        />
      </aside>
    );
  }

}
