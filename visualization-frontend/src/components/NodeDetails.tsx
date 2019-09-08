import * as React from 'react';

import { Dag } from '../model/dag';
import './NodeDetails.css';

type Props = {
  dag: Dag,
  nodeSelection: number[]
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
              <p>{selectedNode.toString()}</p>
            </article>
          )
        }
        {
          !selectedNode && <small id="nodeInfo"><strong>{nodeInfo}</strong> selected</small>
        }
      </section>
    );
  }

}
