import * as React from 'react';
import './NodeMenu.css';


const icons = require('../resources/icons/all.svg') as string;

type Props = {
  nodeSelection: number[],
  onSelectParents,
  onSelectChildren,
  onFindCommonConsequences
};
type State = {
  nodeSelection: number[]
};
export default class NodeMenu extends React.Component<Props, State> {

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
    const {onSelectParents, onSelectChildren, onFindCommonConsequences} = this.props;

    return (
      <section className="component-node-menu">
        <button
          title="Select parents of selected nodes"
          disabled={!nodeSelection.length}
          onClick={onSelectParents}
        >
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#node-parents`}/>
          </svg>
        </button>
        <button
          title="Select children of selected nodes"
          disabled={!nodeSelection.length}
          onClick={onSelectChildren}
        >
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#node-children`}/>
          </svg>
        </button>
        <button
          title="Find common consequences of selected nodes"
          disabled={nodeSelection.length < 2}
          onClick={onFindCommonConsequences}
        >
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#node-consequences`}/>
          </svg>
        </button>
      </section>
    );
  }

}
