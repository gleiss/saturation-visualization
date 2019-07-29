import React, {Component} from 'react';

import './App.css';
import Main from './Main';
import Aside from './Aside';

class App extends Component {

  state = {
    nodeSelection: []
  };

  async componentDidMount() {
    await this.fetchDag();
  }

  render() {
    const {error, isLoaded, dag, nodes, nodeSelection, historyState, versionCount} = this.state;
    let main;

    if (isLoaded && dag) {
      main = (
        <Main
          dag={dag}
          nodeSelection={nodeSelection}
          historyState={historyState}
          onNetworkChange={this.setNetwork.bind(this)}
          onNodeSelectionChange={this.updateNodeSelection.bind(this)}
          onHistoryStateChange={this.updateHistoryState.bind(this)}
        />
      );
    } else {
      const message = error ? `Error: ${error.message}` : 'Loading...';
      main = (
        <main>
          <section className="graph-placeholder">{message}</section>
          <section className="slider-placeholder"/>
        </main>
      );
    }

    return (
      <div className="app">
        {main}
        <Aside
          nodes={nodes}
          nodeSelection={nodeSelection}
          versionCount={versionCount}
          onUpdateNodeSelection={this.updateNodeSelection.bind(this)}
          onUploadFile={this.uploadFile.bind(this)}
          onUndo={this.undoLastStep.bind(this)}
          onRenderParentsOnly={this.renderParentsOnly.bind(this)}
          onRenderChildrenOnly={this.renderChildrenOnly.bind(this)}
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

  updateHistoryState(historyState) {
    this.setState({historyState: parseInt(historyState, 10)});
  }


  // FILE UPLOAD ///////////////////////////////////////////////////////////////////////////////////////////////////////

  fetchDag() {
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(
        (result) => {
          sessionStorage.setItem('versions', '[]');
          this.setState({
            isLoaded: true,
            dag: result.dag,
            historyState: Object.keys(result.dag.nodes).length,
            versionCount: 0,
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

  uploadFile(file) {
    fetch('http://localhost:5000', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({file}),
    })
      .then(res => res.json())
      .then(
        (result) => {
          sessionStorage.setItem('versions', '[]');
          this.setState({
            isLoaded: true,
            dag: result.dag,
            historyState: Object.keys(result.dag.nodes).length,
            versionCount: 0,
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


  // SUBGRAPH SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////

  undoLastStep() {
    const {versionCount} = this.state;
    const latestDag = this._unstoreLatestVersion();

    if (latestDag) {
      this.setState({
        dag: latestDag,
        historyState: Object.keys(latestDag.nodes).length,
        versionCount: versionCount - 1
      });
    }
  }

  renderParentsOnly() {
    const {dag, nodeSelection} = this.state;

    const listsOfParents = nodeSelection.map(node => this._findAllParents(node));
    const parentNodesIncludingDuplicates = [].concat(...listsOfParents, ...nodeSelection);
    const parentNodes = [...new Set(parentNodesIncludingDuplicates)];

    this._storeVersion(dag);
    this._cutDag(parentNodes);
  }

  renderChildrenOnly() {
    const {dag, nodeSelection} = this.state;

    const listsOfChildren = nodeSelection.map(node => this._findAllChildren(node));
    const childNodesIncludingDuplicates = [].concat(...listsOfChildren, ...nodeSelection);
    const childNodes = [...new Set(childNodesIncludingDuplicates)];

    this._storeVersion(dag);
    this._cutDag(childNodes);
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
    const {nodeSelection} = this.state;

    const newNodeSelection = nodeSelection
      .map(node => this._findAllChildren(node))
      .reduce((a, b) => a.filter(child => b.includes(child)));

    this.updateNodeSelection(newNodeSelection);
  }


  // HELPERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _findAllParents(node) {
    const {edges, network} = this.state;
    const selectionSet = new Set();

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.to === node)
      .forEach(edge => {
        selectionSet.add(edge.from);
        this._addAllParents(edge.from, selectionSet);
      });
    return [...selectionSet];
  }

  _addAllParents(node, selectionSet) {
    const {edges, network} = this.state;

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.to === node)
      .forEach(edge => {
        if (!selectionSet.has(edge.from)) {
          selectionSet.add(edge.from);
          this._addAllParents(edge.from, selectionSet);
        }
      })
  }

  _findAllChildren(node) {
    const {edges, network} = this.state;
    const selectionSet = new Set();

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.from === node)
      .forEach(edge => {
        selectionSet.add(edge.to);
        this._addAllChildren(edge.to, selectionSet);
      });
    return [...selectionSet];
  }

  _addAllChildren(node, selectionSet) {
    const {edges, network} = this.state;

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.from === node)
      .forEach(edge => {
        if (!selectionSet.has(edge.to)) {
          selectionSet.add(edge.to);
          this._addAllChildren(edge.to, selectionSet);
        }
      })
  }

  _cutDag(remainingNodeNumbers) {
    const {dag, versionCount} = this.state;
    const remainingNodes = {};

    remainingNodeNumbers.forEach(number => remainingNodes[number] = dag.nodes[number]);
    this.setState({
      dag: {nodes: remainingNodes},
      historyState: Object.keys(remainingNodes).length,
      versionCount: versionCount + 1
    });
  }

  _storeVersion = (dag) => {
    const versions = JSON.parse(sessionStorage.getItem('versions') || '[]');

    versions.push(dag);
    sessionStorage.setItem('versions', JSON.stringify(versions));
  };

  _unstoreLatestVersion = () => {
    const versions = JSON.parse(sessionStorage.getItem('versions') || '[]');
    let latestVersion;

    if (versions.length) {
      latestVersion = versions.pop();
      sessionStorage.setItem('versions', JSON.stringify(versions));
    }
    return latestVersion;
  };

}

export default App;
