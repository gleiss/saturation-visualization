import * as React from 'react';

import { Dag } from '../model/dag';
import {Literal} from '../model/literal'
import Slider from './Slider';
import Graph from './Graph';
import { PassiveDagModal } from './PassiveDagModal';


type Props = {
  dag: Dag,
  showPassiveDag: boolean,
  nodeSelection: number[],
  changedNodesEvent?: Set<number>,
  historyLength: number,
  currentTime: number,
  animateDagChanges: boolean,
  infoToggle: boolean,
  editToggle: boolean,
  onNodeSelectionChange: (selection: number[]) => void,
  onCurrentTimeChange: (newState: number) => void,
  onDismissPassiveDag: (selectedId: number | null, positioningHint: [number, number] | null) => void,
  onUpdateNodePositions: (nodeIds: Array<number>, delta: [number, number]) => void,
  onLiteralOrientationChange: (nodeId: number, oldPosition: ["premise" | "conclusion" | "context", number], newPosition: ["premise" | "conclusion" | "context", number]) => void,
  onLiteralRepresentationChange: (nodeId: number, literal: Literal) => void,
  onToggleInfo: () => void,
  onToggleEdit: () => void
};

export default class Main extends React.Component<Props, {}> {

  render() {
    let modal;
    if (this.props.showPassiveDag) {
      modal = 
        <PassiveDagModal
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
          currentTime={this.props.currentTime}
          changedNodesEvent={this.props.changedNodesEvent}
          infoToggle={this.props.infoToggle}
          editToggle={this.props.editToggle}
          onLiteralOrientationChange={this.props.onLiteralOrientationChange}
          onLiteralRepresentationChange={this.props.onLiteralRepresentationChange}
          onDismissPassiveDag={this.props.onDismissPassiveDag}
          onToggleInfo={this.props.onToggleInfo}
          onToggleEdit={this.props.onToggleEdit}
        />
    }

    return (
      <main>
        <Graph
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
          changedNodesEvent={this.props.changedNodesEvent}
          currentTime={this.props.currentTime}
          animateDagChanges={this.props.animateDagChanges}
          onNodeSelectionChange={this.props.onNodeSelectionChange}
          onUpdateNodePositions={this.props.onUpdateNodePositions}
        />
        {modal}
        <Slider
          historyLength={this.props.historyLength}
          currentTime={this.props.currentTime}
          onCurrentTimeChange={this.props.onCurrentTimeChange}
        />
      </main>
    );
  }
}
