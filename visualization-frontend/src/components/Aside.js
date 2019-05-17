import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeMenu from './NodeMenu';


export default class Aside extends React.Component {
  render() {
    return (
      <aside>
        <GraphMenu/>
        <NodeMenu/>
      </aside>
    );
  }
}
