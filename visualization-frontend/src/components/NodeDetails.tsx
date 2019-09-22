import * as React from 'react';

import './NodeDetails.css';
import Sortable from 'react-sortablejs';
import { Clause } from '../model/unit';
import { Literal } from '../model/literal';
import SatNode from '../model/sat-node';

type Props = {
  node: SatNode,
  numberOfTransitiveActivatedChildren: number,
  onLiteralOrientationChange: (nodeId: number, oldPosition: [boolean, number], newPosition: [boolean, number]) => void,
  onLiteralRepresentationChange: (nodeId: number, literal: Literal) => void
};

export default class NodeDetails extends React.Component<Props, {}> {

  // BUG: labels of list items get out of sync as soon as a literal is dragged to another listss
  render() {
    return (
      <section className={'component-node-details details'}>
        <article>
          <h2>Node <strong>{this.props.node.id}, {this.props.numberOfTransitiveActivatedChildren} children</strong></h2>
          <h3>{this.props.node.inferenceRule}</h3>
          {
            this.props.node.unit.type === "Formula" ? (
              <section className={'literal-wrapper'}>
                {
                  this.props.node.toString()
                }
              </section>
            ) : (
              <section className={'literal-wrapper'}>
                {
                  this.toList(this.props.node.id, this.props.node.unit as Clause, false)
                }
                <br/>
                {
                  this.toList(this.props.node.id, this.props.node.unit as Clause, true)
                }
              </section>
            )
          }
        </article>
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
    return <li key={index} data-id={index} onDoubleClick={(event) => {
      this.props.onLiteralRepresentationChange(this.props.node.id, literal);
      event.currentTarget.innerText = literal.toString(inConclusion);
    }}>{literal.toString(inConclusion)}</li>
  };
}
