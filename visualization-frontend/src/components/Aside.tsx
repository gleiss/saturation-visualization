import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';
import { Dag } from '../model/dag';


type Props = {
  dag: Dag,
  nodeSelection: number[],
  multipleVersions: boolean,
  onUpdateNodeSelection: (selection: number[]) => void,
  onUploadFile: (fileContent: string | ArrayBuffer) => void,
  onUndo: () => void,
  onRenderParentsOnly: () => void,
  onRenderChildrenOnly: () => void,
  onSelectParents: () => void,
  onSelectChildren: () => void,
  onSelectCommonConsequences: () => void,
  onLiteralOrientationChange: (nodeId: number, oldPosition: [boolean, number], newPosition: [boolean, number]) => void
};
export default class Aside extends React.Component<Props, {}> {

  render() {
    return (
      <aside>
        <GraphMenu
          undoEnabled={this.props.multipleVersions}
          filterUpEnabled={this.props.nodeSelection.length > 0 && !this.props.dag.isPassiveDag}
          filterDownEnabled={this.props.nodeSelection.length > 0 && !this.props.dag.isPassiveDag}
          nodeSelection={this.props.nodeSelection}
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
          onSelectCommonConsequences={this.props.onSelectCommonConsequences}
        />
        <NodeDetails
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
          onLiteralOrientationChange={this.props.onLiteralOrientationChange}
        />
      </aside>
    );
  }

}
