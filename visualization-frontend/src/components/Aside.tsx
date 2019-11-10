import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import {Dag} from '../model/dag';
import {Literal} from '../model/literal';
import {assert} from '../model/util';
import {NodeDetailsWrapper} from './NodeDetailsWrapper';


type Props = {
  dag: Dag | null,
  currentTime: number,
  nodeSelection: number[],
  multipleVersions: boolean,
  infoToggle: boolean,
  editToggle: boolean,
  onUpdateNodeSelection: (selection: number[]) => void,
  onUndo: () => void,
  onRenderParentsOnly: () => void,
  onRenderChildrenOnly: () => void,
  onShowPassiveDag: () => void,
  onSelectParents: () => void,
  onSelectChildren: () => void,
  onSelectCommonConsequences: () => void,
  onLiteralOrientationChange: (nodeId: number, oldPosition: ['premise' | 'conclusion' | 'context', number], newPosition: ['premise' | 'conclusion' | 'context', number]) => void,
  onLiteralRepresentationChange: (nodeId: number, literal: Literal) => void,
  onToggleInfo: () => void,
  onToggleEdit: () => void
};
export default class Aside extends React.Component<Props, {}> {

  render() {
    if (this.props.dag === null) {
      assert(this.props.nodeSelection.length === 0);
      assert(!this.props.multipleVersions);
    }

    const passiveDagButtonEnabled = this.props.dag !== null && this.props.nodeSelection.length > 0;

    return (
      <div className="scroll">
        <aside>
          <GraphMenu
            undoEnabled={this.props.dag !== null && this.props.multipleVersions}
            filterUpEnabled={this.props.dag !== null && this.props.nodeSelection.length > 0 && !this.props.dag!.isPassiveDag}
            filterDownEnabled={this.props.dag !== null && this.props.nodeSelection.length > 0 && !this.props.dag!.isPassiveDag}
            passiveDagButtonEnabled={passiveDagButtonEnabled}
            onUndo={this.props.onUndo}
            onRenderParentsOnly={this.props.onRenderParentsOnly}
            onRenderChildrenOnly={this.props.onRenderChildrenOnly}
            onShowPassiveDag={this.props.onShowPassiveDag}
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
          <NodeDetailsWrapper
            dag={this.props.dag}
            nodeSelection={this.props.nodeSelection}
            currentTime={this.props.currentTime}
            infoToggle={this.props.infoToggle}
            editToggle={this.props.editToggle}
            onLiteralOrientationChange={this.props.onLiteralOrientationChange}
            onLiteralRepresentationChange={this.props.onLiteralRepresentationChange}
            onToggleInfo={this.props.onToggleInfo}
            onToggleEdit={this.props.onToggleEdit}
          />
        </aside>
      </div>
    );
  }

}
