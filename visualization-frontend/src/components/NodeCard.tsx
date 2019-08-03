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

  render() {
    return (
      <section className="component-node-card">
        <article>
          <h2>Select Nodes</h2>
          <NodeMenu
            nodeSelection={this.props.nodeSelection}
            onSelectParents={this.props.onSelectParents}
            onSelectChildren={this.props.onSelectChildren}
            onFindCommonConsequences={this.props.onFindCommonConsequences}
          />
          <Search
            nodes={this.props.nodes}
            onUpdateNodeSelection={this.props.onUpdateNodeSelection}
          />
        </article>
      </section>
    );
  }

}
