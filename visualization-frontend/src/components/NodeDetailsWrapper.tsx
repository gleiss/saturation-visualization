import * as React from 'react';
import { Dag } from '../model/dag';

import NodeDetails from '../components/NodeDetails'
import { Literal } from '../model/literal';

type Props = {
  dag: Dag | null,
  nodeSelection: number[],
  currentTime: number,
  infoToggle: boolean,
  editToggle: boolean,
  onLiteralOrientationChange: (nodeId: number, oldPosition: ['premise' | 'conclusion' | 'context', number], newPosition: ['premise' | 'conclusion' | 'context', number]) => void,
  onLiteralRepresentationChange: (nodeId: number, literal: Literal) => void,
  onToggleInfo: () => void,
  onToggleEdit: () => void
};

export class NodeDetailsWrapper extends React.Component<Props, {}> {

  render() {
    if (this.props.nodeSelection.length === 1) {
      const node = this.props.dag!.get(this.props.nodeSelection[0]);
      return (
        <NodeDetails
          node={node}
          numberOfTransitiveActivatedChildren={this.props.dag!.numberOfTransitiveActivatedChildren(node.id, this.props.currentTime)}
          infoToggle={this.props.infoToggle}
          editToggle={this.props.editToggle}
          onLiteralOrientationChange={this.props.onLiteralOrientationChange}
          onLiteralRepresentationChange={this.props.onLiteralRepresentationChange}
          onToggleInfo={this.props.onToggleInfo}
          onToggleEdit={this.props.onToggleEdit}
        />
      )
    } else {
      return (
        <section className={'component-node-details overview'}>
          <small id="nodeInfo"><strong>{`${this.props.nodeSelection.length} nodes`}</strong> selected</small>
        </section>
      )
    }
  }
}