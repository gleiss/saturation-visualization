import * as React from 'react';
import {DataSet} from 'vis';

import {NetworkNode} from '../model/networkNode';

import './NodeDetails.css';


type Props = {
  nodes: DataSet<NetworkNode>,
  nodeSelection: number[]
};
type State = {
  nodeSelection: number[]
};
export default class NodeDetails extends React.Component<Props, State> {

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
