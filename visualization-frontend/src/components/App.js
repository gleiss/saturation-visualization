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

    if (error) {
      return (
        <div className="app">
          <main>
            <section className="placeholder">Error: {error.message}</section>
          </main>
          <Aside
            nodeSelection={nodeSelection}
            onSelectParents={this.selectParents.bind(this)}
            onSelectChildren={this.selectChildren.bind(this)}
            onFindCommonConsequences={this.findCommonConsequences.bind(this)}
          />
        </div>
      );
    } else if (!isLoaded) {
      return (
        <div className="app">
          <main>
            <section className="placeholder">Loading...</section>
          </main>
          <Aside
            nodeSelection={nodeSelection}
            onSelectParents={this.selectParents.bind(this)}
            onSelectChildren={this.selectChildren.bind(this)}
            onFindCommonConsequences={this.findCommonConsequences.bind(this)}
          />
        </div>
      );
    } else {
      return (
        <div className="app">
          <Main
            dag={dag}
            nodeSelection={nodeSelection}
            onNodeSelectionChange={this.updateNodeSelection.bind(this)}
            onNetworkChange={this.setNetwork.bind(this)}
          />
          <Aside
            nodeSelection={nodeSelection}
            onSelectParents={this.selectParents.bind(this)}
            onSelectChildren={this.selectChildren.bind(this)}
            onFindCommonConsequences={this.findCommonConsequences.bind(this)}
          />
        </div>
      );
    }
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

    nodeSelection.forEach(number => {
      network
        .getConnectedEdges(number)
        .forEach(edgeId => {
          const edge = edges.get(edgeId);
          if (edge.to === number) {
            selectionSet.add(edge.from);
          }
        })
    });
    const newNodeSelection = [...selectionSet];
    this.updateNodeSelection(newNodeSelection);
  }

  selectChildren() {
    const {edges, network, nodeSelection} = this.state;
    const selectionSet = new Set(nodeSelection);

    nodeSelection.forEach(number => {
      network
        .getConnectedEdges(number)
        .forEach(edgeId => {
          const edge = edges.get(edgeId);
          if (edge.from === number) {
            selectionSet.add(edge.to);
          }
        })
    });
    const newNodeSelection = [...selectionSet];
    this.updateNodeSelection(newNodeSelection);
  }

  findCommonConsequences() {
  }

}

export default App;
