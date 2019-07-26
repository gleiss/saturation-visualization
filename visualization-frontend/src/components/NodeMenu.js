import * as React from 'react';

import './NodeMenu.css';


export default class NodeMenu extends React.Component {

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

    return (
      <section className="component-node-menu">
        <button
          title="Select parents of selected nodes"
          disabled={!nodeSelection.length}
          onClick={this.props.onSelectParents}
        >
        </button>
        <button
          title="Select children of selected nodes"
          disabled={!nodeSelection.length}
          onClick={this.props.onSelectChildren}
        >
        </button>
        <button
          title="Find common consequences of selected nodes"
          disabled={!nodeSelection.length}
          onClick={this.props.onFindCommonConsequences}
        >
        </button>
      </section>
    );
  }

}
