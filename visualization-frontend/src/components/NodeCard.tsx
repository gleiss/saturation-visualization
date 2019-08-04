import * as React from 'react';
import {DataSet} from 'vis';

import NetworkNode from '../model/network/network-node';
import NodeMenu from './NodeMenu';
import Search from './Search';
import './NodeCard.css';


type Props = {
  nodes: DataSet<NetworkNode> | null,
  nodeSelection: number[],
  onUpdateNodeSelection: (selection: number[]) => void,
  onSelectParents: () => void,
  onSelectChildren: () => void,
  onFindCommonConsequences: () => void
};
export default class NodeCard extends React.Component<Props, {}> {

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
