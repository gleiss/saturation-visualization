import * as React from 'react';

import './NodeCard.css';


export default class NodeDetails extends React.Component {

  state = {nodeSelection: []};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    }
  }

  render() {
    const {nodeSelection} = this.state;
    const {nodes} = this.props;
    const oneNodeSelected = nodeSelection.length === 1;
    const selectedNode = oneNodeSelected ?
      nodes.get(nodeSelection[0]) :
      undefined;
    const nodeInfo = oneNodeSelected ?
      '1 node' :
      `${nodeSelection.length} nodes`;

    return (
      <section className="component-node-card">
        {
          oneNodeSelected && (
            <article id="nodeDetails">
              <h2>Node <span id="nodeDetailsId">{selectedNode.id}</span></h2>
              <h3 id="nodeDetailsRule">{selectedNode.rule}</h3>
              <p id="nodeDetailsClause">{selectedNode.label}</p>
            </article>
          )
        }
        <small id="nodeInfo"><strong>{nodeInfo}</strong> selected</small>
      </section>
    );
  }

}
