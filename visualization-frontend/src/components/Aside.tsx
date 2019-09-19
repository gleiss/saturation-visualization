import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';
import { Dag } from '../model/dag';
import { Literal } from '../model/literal';


type Props = {
  dag: Dag,
  nodeSelection: number[],
  multipleVersions: boolean,
  onUpdateNodeSelection: (selection: number[]) => void,
  onUndo: () => void,
  onRenderParentsOnly: () => void,
  onRenderChildrenOnly: () => void,
  onSelectParents: () => void,
  onSelectChildren: () => void,
  onSelectCommonConsequences: () => void,
  onLiteralOrientationChange: (nodeId: number, oldPosition: [boolean, number], newPosition: [boolean, number]) => void,
  onLiteralRepresentationChange: (nodeId: number, literal: Literal) => void
};
export default class Aside extends React.Component<Props, {}> {

  render() {
    let nodeDetails;
    if (this.props.nodeSelection.length === 1) {
      const node = this.props.dag.get(this.props.nodeSelection[0]);
      nodeDetails = 
      <NodeDetails
        node={node}
        onLiteralOrientationChange={this.props.onLiteralOrientationChange}
        onLiteralRepresentationChange={this.props.onLiteralRepresentationChange}
      />;
    } else {
      nodeDetails = 
      <section className={'component-node-details overview'}>
        <small id="nodeInfo"><strong>{`${this.props.nodeSelection.length} nodes`}</strong> selected</small>
      </section>
    }

    return (
      <aside>
        <GraphMenu
          undoEnabled={this.props.multipleVersions}
          filterUpEnabled={this.props.nodeSelection.length > 0 && !this.props.dag.isPassiveDag}
          filterDownEnabled={this.props.nodeSelection.length > 0 && !this.props.dag.isPassiveDag}
          nodeSelection={this.props.nodeSelection}
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
        {nodeDetails}
      </aside>
    );
  }

}
