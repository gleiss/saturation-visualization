import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';


export default class Aside extends React.Component {
  render() {
    return (
      <aside>
        <GraphMenu/>
        <NodeCard/>
      </aside>
    );
  }
}
