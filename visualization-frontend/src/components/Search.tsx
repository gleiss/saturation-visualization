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
          ref={this.searchField}
          type="text"
          placeholder="Search for a node ..."
          onKeyUp={this.search.bind(this)}
        />
        <ul id="searchResults" className={foundNodes.length ? 'focused' : ''}>
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
    const searchValue = this.searchField.current ? this.searchField.current.value : '';
    let foundNodes: SatNode[] = [];

    if (searchValue) {
      foundNodes = Object.values(this.props.dag.nodes)
        .map(node => node)
        .filter(node => node.clause.includes(searchValue));
      foundNodes.sort((a, b) => a.clause.length - b.clause.length);
      this.props.onUpdateNodeSelection(foundNodes.map(node => node.id));
      foundNodes = foundNodes.filter(node => node.clause !== 'Preproc');
    }
    this.setState({
      foundNodes
    });

  }

  toListItem = (node: SatNode) => {
    return <li key={node.id} onClick={() => this.props.onUpdateNodeSelection([node.id])}>${node.clause}</li>;
  };

  getDisabledListItem = () => {
    return <li className="disabled-element">...</li>;
  };

}
