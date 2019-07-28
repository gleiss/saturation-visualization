import * as React from 'react';


export default class Search extends React.Component {

  state = {
    nodes: {},
    foundNodes: []
  };

  componentDidUpdate(prevProps) {
    if (this.props.nodes !== prevProps.nodes) {
      this.setState({
        nodes: this.props.nodes
      });
    }
  }

  render() {
    const {foundNodes} = this.state;

    return (
      <section className="component-node-card">
        <input
          ref={ref => this.searchField = ref}
          id="search"
          type="text"
          className="sidebar-input spaced"
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
    const {nodes} = this.state;
    const {onUpdateNodeSelection} = this.props;

    const searchValue = this.searchField.value;

    if (searchValue) {
      let foundNodes = Object
        .values(nodes._data)
        .filter(node => node.label.includes(searchValue));
      foundNodes.sort((a, b) => a.label.length - b.label.length);

      const selectedIds = foundNodes.map(node => node.id);

      foundNodes = foundNodes.filter(node => node.label !== 'Preproc');
      this.setState({foundNodes});

      onUpdateNodeSelection(selectedIds);
    }
  }

  toListItem = (node) => {
    const {onUpdateNodeSelection} = this.props;

    return (
      <li key={node.id} onClick={() => onUpdateNodeSelection([node.id])}>
        ${node.label}
      </li>
    );
  };

  getDisabledListItem = () => {
    return <li className="disabled-element">...</li>;
  };

}
