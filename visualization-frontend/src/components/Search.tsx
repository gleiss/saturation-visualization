import * as React from 'react';

import Dag from '../model/dag';
import './Search.css';
import SatNode from '../model/sat-node';


type Props = {
  dag: Dag,
  onUpdateNodeSelection: (selection: number[]) => void
};
type State = {
  foundNodes: SatNode[]
};
export default class Search extends React.Component<Props, State> {

  state = {
    foundNodes: []
  };
  private searchField = React.createRef<HTMLInputElement>();

  render() {
    const {foundNodes} = this.state;

    return (
      <section className="component-search">
        <input
          disabled={!(this.props.dag && !!Object.values(this.props.dag.nodes).length)}
          ref={this.searchField}
          type="text"
          placeholder="Search for a node ..."
          onKeyUp={this.search.bind(this)}
        />
        <ul id="searchResults">
          {
            foundNodes.slice(0, 21).map(node => this.toListItem(node))
          }
          {
            foundNodes.length > 20 && this.getDisabledListItem()
          }
        </ul>
      </section>
    );
  }


  // SEARCH ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  search() {
    // BUG: crashes if search is performed before loading dag.
    const searchValue = this.searchField.current ? this.searchField.current.value : '';
    let foundNodes: SatNode[] = [];

    if (searchValue) {
      for (const node of this.props.dag.nodes.values()) {
        if (node.toString().includes(searchValue)) {
          foundNodes.push(node);
        }
      }
      foundNodes.sort((a, b) => a.toString().length - b.toString().length);
      this.props.onUpdateNodeSelection(foundNodes.map(node => node.id));
      foundNodes = foundNodes.filter(node => node.toString() !== 'Preproc');
    }
    this.setState({
      foundNodes
    });

  }

  toListItem = (node: SatNode) => {
    return <li key={node.id} onClick={() => this.props.onUpdateNodeSelection([node.id])}>{node.toString()}</li>;
  };

  getDisabledListItem = () => {
    return <li className="disabled-element">...</li>;
  };

}
