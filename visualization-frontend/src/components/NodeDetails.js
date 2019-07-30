import * as React from 'react';

import './NodeDetails.css';


export default class NodeDetails extends React.Component {

  render() {
    const oneNodeSelected = this.props.nodeSelection.length === 1;
    const selectedNode = oneNodeSelected ?
      this.props.nodes.get(this.props.nodeSelection[0]) :
      undefined;
    const nodeInfo = oneNodeSelected ?
      '1 node' :
      `${this.props.nodeSelection.length} nodes`;

    return (
      <section className={`component-node-details ${oneNodeSelected ? 'details' : 'overview'}`}>
        {
          oneNodeSelected && (
            <article>
              <h2>Node <strong>{selectedNode.id}</strong></h2>
              <h3>{selectedNode.rule}</h3>
              <p>{selectedNode.label}</p>
            </article>
          )
        }
        <small id="nodeInfo"><strong>{nodeInfo}</strong> selected</small>
      </section>
    );
  }
}
