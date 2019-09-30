import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';
import { Dag } from '../model/dag';
import { Literal } from '../model/literal';
import { assert } from '../model/util';


type Props = {
  dag: Dag | null,
  currentTime: number,
  nodeSelection: number[],
  multipleVersions: boolean,
  onUpdateNodeSelection: (selection: number[]) => void,
  onUndo: () => void,
  onRenderParentsOnly: () => void,
  onRenderChildrenOnly: () => void,
  onShowPassiveDag: () => void,
  onDismissPassiveDag: (performActivation: boolean) => void,
  onSelectParents: () => void,
  onSelectChildren: () => void,
  onSelectCommonConsequences: () => void,
  onLiteralOrientationChange: (nodeId: number, oldPosition: ["premise" | "conclusion" | "context", number], newPosition: ["premise" | "conclusion" | "context", number]) => void,
  onLiteralRepresentationChange: (nodeId: number, literal: Literal) => void
};
export default class Aside extends React.Component<Props, {}> {

  render() {
    if (this.props.dag === null) {
      assert(this.props.nodeSelection.length === 0);
      assert(!this.props.multipleVersions);
    }

    let nodeDetails;
    if (this.props.nodeSelection.length === 1) {
      const node = this.props.dag!.get(this.props.nodeSelection[0]);
      nodeDetails = 
      <NodeDetails
        node={node}
        numberOfTransitiveActivatedChildren={this.props.dag!.numberOfTransitiveActivatedChildren(node.id, this.props.currentTime)}
        onLiteralOrientationChange={this.props.onLiteralOrientationChange}
        onLiteralRepresentationChange={this.props.onLiteralRepresentationChange}
      />;
    } else {
      nodeDetails = 
      <section className={'component-node-details overview'}>
        <small id="nodeInfo"><strong>{`${this.props.nodeSelection.length} nodes`}</strong> selected</small>
      </section>
    }

    let passiveDagButtonFunctionality: "activate" | "show" = "activate";
    let passiveDagButtonEnabled = false;
    if (this.props.dag !== null) {
      passiveDagButtonFunctionality = this.props.dag!.isPassiveDag ? "show" : "activate";
      if (passiveDagButtonFunctionality === "activate") {
        passiveDagButtonEnabled = this.props.nodeSelection.length > 0;
      } else {
        const styleMap = this.props.dag!.styleMap!;
        assert(styleMap !== null);
        passiveDagButtonEnabled = this.props.currentTime === this.props.dag.maximalActiveTime() && this.props.nodeSelection.length === 1 && styleMap.get(this.props.nodeSelection[0]) === "passive";
      }
    }

    return (
      <aside>
        <GraphMenu
          undoEnabled={this.props.dag !== null && this.props.multipleVersions}
          filterUpEnabled={this.props.dag !== null && this.props.nodeSelection.length > 0 && !this.props.dag!.isPassiveDag}
          filterDownEnabled={this.props.dag !== null && this.props.nodeSelection.length > 0 && !this.props.dag!.isPassiveDag}
          passiveDagButtonFunctionality={passiveDagButtonFunctionality}
          passiveDagButtonEnabled={passiveDagButtonEnabled}
          onUndo={this.props.onUndo}
          onRenderParentsOnly={this.props.onRenderParentsOnly}
          onRenderChildrenOnly={this.props.onRenderChildrenOnly}
          onShowPassiveDag={this.props.onShowPassiveDag}
          onDismissPassiveDag={this.props.onDismissPassiveDag}
        />
        <NodeCard
          dag={this.props.dag}
          currentTime={this.props.currentTime}
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
