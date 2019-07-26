import React, {Component} from 'react';

import './App.css';
import Main from './Main';
import Aside from './Aside';

class App extends Component {

  state = {
    nodeSelection: []
  };

  componentWillMount() {
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            dag: result.dag,
            error: false
          });
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  render() {
    const {error, isLoaded, dag, nodeSelection} = this.state;

    let main;
    if (isLoaded && dag) {
      main = (
        <Main
          dag={dag}
          nodeSelection={nodeSelection}
          onNodeSelectionChange={this.updateNodeSelection.bind(this)}
          onNetworkChange={this.setNetwork.bind(this)}
        />
      );
    } else {
      const message = error ? `Error: ${error.message}` : 'Loading...';
      main = (
        <main>
          <section className="placeholder">{message}</section>
        </main>
      );
    }

    return (
      <div className="app">
        {main}
        <Aside
          nodeSelection={nodeSelection}
          onSelectParents={this.selectParents.bind(this)}
          onSelectChildren={this.selectChildren.bind(this)}
          onFindCommonConsequences={this.findCommonConsequences.bind(this)}
        />
      </div>
    );

  }


  // NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  setNetwork(network, nodes, edges) {
    this.setState({network, nodes, edges});
  }

  updateNodeSelection(nodeSelection) {
    this.setState({nodeSelection});
  }


  // NODE SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////////

  selectParents() {
    const {edges, network, nodeSelection} = this.state;
    const selectionSet = new Set(nodeSelection);

    nodeSelection.forEach(node => {
      network
        .getConnectedEdges(node)
        .map(edgeId => edges.get(edgeId))
        .filter(edge => edge.to === node)
        .forEach(edge => selectionSet.add(edge.from))
    });
    this.updateNodeSelection([...selectionSet]);
  }

  selectChildren() {
    const {edges, network, nodeSelection} = this.state;
    const selectionSet = new Set(nodeSelection);

    nodeSelection.forEach(node => {
      network
        .getConnectedEdges(node)
        .map(edgeId => edges.get(edgeId))
        .filter(edge => edge.from === node)
        .forEach(edge => selectionSet.add(edge.to))
    });
    this.updateNodeSelection([...selectionSet]);
  }

  findCommonConsequences() {
  }

}

export default App;
