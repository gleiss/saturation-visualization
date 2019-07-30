import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';


export default class Aside extends React.Component {

  render() {
    return (
      <aside>
        <GraphMenu
          nodeSelection={this.props.nodeSelection}
          versionCount={this.props.versionCount}
          onUploadFile={this.props.onUploadFile}
          onUndo={this.props.onUndo}
          onRenderParentsOnly={this.props.onRenderParentsOnly}
          onRenderChildrenOnly={this.props.onRenderChildrenOnly}
        />
        <NodeCard
          nodes={this.props.nodes}
          nodeSelection={this.props.nodeSelection}
          onUpdateNodeSelection={this.props.onUpdateNodeSelection}
          onSelectParents={this.props.onSelectParents}
          onSelectChildren={this.props.onSelectChildren}
          onFindCommonConsequences={this.props.onFindCommonConsequences}
        />
        <NodeDetails
          nodes={this.props.nodes}
          nodeSelection={this.props.nodeSelection}
        />
      </aside>
    );
  }

}
