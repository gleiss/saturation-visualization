import * as React from 'react';

import './NodeCard.css';
import NodeMenu from './NodeMenu';


export default class NodeCard extends React.Component {
  render() {
    return (
      <section className="component-node-card">
        <article>
          <h2>Select Nodes</h2>
          <NodeMenu/>
          <input type="text"
                 id="search"
                 className="sidebar-input spaced"
                 placeholder="Search for a node ..."
                 onKeyUp="search(this.value)"/>
          <ul id="searchResults"/>
        </article>
        <section>
          <article id="nodeDetails" className="hidden">
            <h2>Node <span id="nodeDetailsId"/></h2>
            <h3 id="nodeDetailsRule"/>
            <p id="nodeDetailsClause"/>
          </article>
          <small id="nodeInfo"><strong id="nodeCount">0 nodes</strong> selected</small>
        </section>
      </section>
    );
  }
}
