import * as React from 'react';
import {DataSet} from 'vis';

import NetworkNode from '../model/network/network-node';
import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';
import Dag from '../model/dag';


type Props = {
  dag: Dag,
  nodeSelection: number[],
  versionCount: number,
  onUpdateNodeSelection: (selection: number[]) => void,
  onUploadFile: (fileContent: string | ArrayBuffer) => void,
  onUndo: () => void,
  onRenderParentsOnly: () => void,
  onRenderChildrenOnly: () => void,
  onSelectParents: () => void,
  onSelectChildren: () => void,
  onFindCommonConsequences: () => void
};
export default class Aside extends React.Component<Props, {}> {

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
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
          onUpdateNodeSelection={this.props.onUpdateNodeSelection}
          onSelectParents={this.props.onSelectParents}
          onSelectChildren={this.props.onSelectChildren}
          onFindCommonConsequences={this.props.onFindCommonConsequences}
        />
        <NodeDetails
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
        />
      </aside>
    );
  }

}
