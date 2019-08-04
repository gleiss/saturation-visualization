import * as React from 'react';
import {DataSet, IdType} from 'vis';

import NetworkNode from '../model/network/network-node';
import './Search.css';


type Props = {
  nodes: DataSet<NetworkNode> | null,
  onUpdateNodeSelection: (selection: IdType[]) => void
};
type State = {
  foundNodes: NetworkNode[]
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
    let foundNodes: NetworkNode[] = [];

    if (searchValue && this.props.nodes) {
      foundNodes = this.props.nodes
        .map(node => node)
        .filter(node => node.label.includes(searchValue));
      foundNodes.sort((a, b) => a.label.length - b.label.length);

      this.props.onUpdateNodeSelection(foundNodes.map(node => node.id));
      foundNodes = foundNodes.filter(node => node.label !== 'Preproc');
    }
    this.setState({
      foundNodes
    });

  }

  toListItem = (node: NetworkNode) => {
    return <li key={node.id} onClick={() => this.props.onUpdateNodeSelection([node.id])}>${node.label}</li>;
  };

  getDisabledListItem = () => {
    return <li className="disabled-element">...</li>;
  };

}
