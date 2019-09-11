import * as React from 'react';

import { Dag } from '../model/dag';
import './NodeDetails.css';
import Sortable from 'react-sortablejs';
import { Clause } from '../model/unit';
import { Literal } from '../model/literal';

type Props = {
  dag: Dag,
  nodeSelection: number[],
  onLiteralOrientationChange: (nodeId: number, oldPosition: [boolean, number], newPosition: [boolean, number]) => void
};

export default class NodeDetails extends React.Component<Props, {}> {

  render() {
    const oneNodeSelected = this.props.nodeSelection.length === 1;
    const selectedNode = oneNodeSelected ?
      this.props.dag.get(this.props.nodeSelection[0]) :
      undefined;
    const nodeInfo = oneNodeSelected ? '1 node' : `${this.props.nodeSelection.length} nodes`;

    return (
      <section className={`component-node-details ${oneNodeSelected ? 'details' : 'overview'}`}>
        {
          selectedNode && (
            <article>
              <h2>Node <strong>{selectedNode.id}</strong></h2>
              <h3>{selectedNode.inferenceRule}</h3>
              {
                selectedNode.unit.type === "Formula" ? (
                  <section className={'literal-wrapper'}>
                    {
                      selectedNode.toString()
                    }
                  </section>
                ) : (
                  <section className={'literal-wrapper'}>
                    {
                      this.toList(selectedNode.id, selectedNode.unit as Clause, false)
                    }
                    <br/>
                    {
                      this.toList(selectedNode.id, selectedNode.unit as Clause, true)
                    }
                  </section>
                )
              }
            </article>
          )
        }
        {
          !selectedNode && <small id="nodeInfo"><strong>{nodeInfo}</strong> selected</small>
        }
      </section>
    );
  }

  toList = (nodeId: number, clause: Clause, isConclusion: boolean) => {
    const literals = isConclusion ? clause.conclusionLiterals : clause.premiseLiterals;
  
    return (
      <Sortable
        options={{
          group: 'shared',
          onAdd: (event) => {
            this.props.onLiteralOrientationChange(nodeId, [!isConclusion, event.oldIndex], [event.from === event.to ? !isConclusion : isConclusion, event.newIndex])
          ;},
          onUpdate: (event) => {
            this.props.onLiteralOrientationChange(nodeId, [isConclusion, event.oldIndex], [isConclusion, event.newIndex])
          ;}
        }}
        tag={"ul"}
        id={isConclusion ? "id2" : "id1"}
      >
        {
          literals.map((literal, index) => this.toListItem(literal, index, isConclusion))
        }
      </Sortable>
      )
    };
  
  toListItem = (literal: Literal, index: number, inConclusion: boolean) => {
    return <li key={index} data-id={index}>{literal.toString(inConclusion)}</li>
  };
}
