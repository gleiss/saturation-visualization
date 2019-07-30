import * as React from 'react';

import './NodeCard.css';
import NodeMenu from './NodeMenu';
import Search from './Search';


export default class NodeCard extends React.Component {

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
