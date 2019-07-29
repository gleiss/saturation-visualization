import * as React from 'react';
import {DataSet} from 'vis';

import {NetworkNode} from '../model/networkNode';

import './NodeCard.css';
import NodeMenu from './NodeMenu';
import Search from './Search';


type Props = {
  nodes: DataSet<NetworkNode>,
  nodeSelection: number[],
  onUpdateNodeSelection,
  onSelectParents,
  onSelectChildren,
  onFindCommonConsequences
};
type State = {
  nodes: DataSet<NetworkNode>,
  nodeSelection: number[]
};
export default class NodeCard extends React.Component<Props, State> {

  state = {nodes: [], nodeSelection: []};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    } else if (this.props.nodes !== prevProps.nodes) {
      this.setState({
        nodes: this.props.nodes
      });
    }
  }

  render() {
    const {nodes, nodeSelection} = this.state;
    const {onUpdateNodeSelection, onSelectParents, onSelectChildren, onFindCommonConsequences} = this.props;

    return (
      <section className="component-node-card">
        <article>
          <h2>Select Nodes</h2>
          <NodeMenu
            nodeSelection={nodeSelection}
            onSelectParents={onSelectParents}
            onSelectChildren={onSelectChildren}
            onFindCommonConsequences={onFindCommonConsequences}
          />
          <Search
            nodes={nodes}
            onUpdateNodeSelection={onUpdateNodeSelection}
          />
        </article>
      </section>
    );
  }

}
