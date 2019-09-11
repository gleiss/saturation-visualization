import * as React from 'react';
import Sortable from 'react-sortablejs';
import {Clause, Formula} from '../model/unit';
import {Literal} from '../model/literal';

import Dag from '../model/dag';
import './NodeDetails.css';

type Props = {
  dag: Dag,
  nodeSelection: number[],
  onLiteralOrientationChange: (node: number, literal: Literal, isConclusion: boolean) => void
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
                selectedNode.unit instanceof Formula ? (
                  <section className={'literal-wrapper'}>
                    selectedNode.toString()
                  </section>
                ) : (
                  <section className={'literal-wrapper'}>
                    {
                      this.toList(selectedNode.id, selectedNode.unit, false)
                    }
                    <br/>
                    {
                      this.toList(selectedNode.id, selectedNode.unit, true)
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
    const literals = clause.literals.filter(entry => entry.orientationIsConclusion === isConclusion);

    return (
      <Sortable
        options={{
          group: 'shared',
          onRemove: (event) => this.props.onLiteralOrientationChange(nodeId, literals[event.oldIndex], !isConclusion)
        }}
        tag="ul"
      >
        {
          literals.map((entry, i) => this.toListItem(entry, i))
        }
      </Sortable>
    )
  };

  toListItem = (literal: Literal, index: number) => {
    return <li key={index} data-id={index}>{literal.toString()}</li>
  };

}
