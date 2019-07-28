import * as React from 'react';

import './NodeCard.css';
import NodeMenu from './NodeMenu';
import Search from './Search';


export default class NodeCard extends React.Component {

  state = {nodeSelection: []};

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
    const nodeInfo = nodeSelection.length === 1 ? '1 node' : `${nodeSelection.length} nodes`;

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
        <section>
          <article id="nodeDetails" className="hidden">
            <h2>Node <span id="nodeDetailsId"/></h2>
            <h3 id="nodeDetailsRule">&nbsp;</h3>
            <p id="nodeDetailsClause"/>
          </article>
          <small id="nodeInfo"><strong>{nodeInfo}</strong> selected</small>
        </section>
      </section>
    );
  }

}
