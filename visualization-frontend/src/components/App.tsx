import * as React from 'react';
import {Component} from 'react';
import {DataSet, Edge, IdType, Network} from 'vis';

import NetworkNode from '../model/network/network-node';
import Main from './Main';
import Aside from './Aside';
import Dag from '../model/dag';
import SatNode from '../model/sat-node';
import './App.css';


type State = {
  dag: Dag | null,
  network: Network | null,
  nodes: DataSet<NetworkNode> | null,
  edges: DataSet<Edge> | null,
  nodeSelection: IdType[],
  historyLength: number,
  historyState: number,
  versionCount: number,
  error: any,
  isLoaded: boolean,
  isLoading: boolean
};

class App extends Component<{}, State> {

  state = {
    dag: null,
    network: null,
    nodes: null,
    edges: null,
    nodeSelection: [],
    historyLength: 0,
    historyState: 0,
    versionCount: 0,
    error: null,
    isLoaded: false,
    isLoading: false
  };

  private versions: (Dag | null)[] = [];

  render() {
    const {error, isLoaded, isLoading, dag, nodes, nodeSelection, historyLength, historyState, versionCount} = this.state;
    let main;

    if (isLoaded && dag) {
      main = (
        <Main
          dag={dag}
          nodeSelection={nodeSelection}
          historyLength={historyLength}
          historyState={historyState}
          onNetworkChange={this.setNetwork.bind(this)}
          onNodeSelectionChange={this.updateNodeSelection.bind(this)}
          onHistoryStateChange={this.updateHistoryState.bind(this)}
        />
      );
    } else if (isLoading || error) {
      const message = error ? `Error: ${error.message}` : 'Loading...';
      main = (
        <main>
          <section className="graph-placeholder">{message}</section>
          <section className="slider-placeholder"/>
        </main>
      );
    } else {
      const message = 'Upload file →';
      main = (
        <main>
          <section className="graph-placeholder upload-info">{message}</section>
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

  setNetwork(network: Network, nodes: DataSet<NetworkNode>, edges: DataSet<Edge>) {
    this.setState({network, nodes, edges});
  }

  updateNodeSelection(nodeSelection: IdType[]) {
    this.setState({nodeSelection});
  }

  updateHistoryState(historyState: number) {
    this.setState({historyState});
  }


  // FILE UPLOAD ///////////////////////////////////////////////////////////////////////////////////////////////////////

  uploadFile(fileContent: string | ArrayBuffer) {
    this.setState({
      isLoading: true,
      error: false
    });

    fetch('http://localhost:5000', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({file: fileContent})
    })
      .then(res => res.json())
      .then(
        (result) => {
          this.versions = [];
          this.setState({
            isLoading: false,
            isLoaded: true,
            dag: result.dag,
            historyLength: Object.keys(result.dag.nodes).length - 1,
            historyState: Object.keys(result.dag.nodes).length - 1,
            versionCount: 0,
            error: false
          });
        },
        (error) => {
          this.setState({
            isLoading: false,
            isLoaded: true,
            error
          });
        }
      )
  }


  // SUBGRAPH SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////

  undoLastStep() {
    const {versionCount} = this.state;
    const latestDag = this.versions.pop();

    if (latestDag) {
      this.setState({
        dag: latestDag,
        historyLength: Object.keys(latestDag.nodes).length - 1,
        historyState: Object.keys(latestDag.nodes).length - 1,
        versionCount: versionCount - 1
      });
    }
  }

  renderParentsOnly() {
    const {dag, nodeSelection} = this.state;

    const listsOfParents = nodeSelection.map(node => this.findAllParents(node));
    const parentNodesIncludingDuplicates = [].concat(...listsOfParents, ...nodeSelection);
    const parentNodes = [...new Set(parentNodesIncludingDuplicates)];

    this.versions.push(dag);
    this.cutDag(parentNodes);
  }

  renderChildrenOnly() {
    const {dag, nodeSelection} = this.state;

    const listsOfChildren = nodeSelection.map(node => this.findAllChildren(node));
    const childNodesIncludingDuplicates = [].concat(...listsOfChildren, ...nodeSelection);
    const childNodes = [...new Set(childNodesIncludingDuplicates)];

    this.versions.push(dag);
    this.cutDag(childNodes);
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
      .map(node => this.findAllChildren(node))
      .reduce((a, b) => a.filter(child => b.includes(child)));

    this.updateNodeSelection(newNodeSelection);
  }


  // HELPERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  private findAllParents(node: NetworkNode) {
    const {edges, network} = this.state;
    const selectionSet = new Set();

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.to === node)
      .forEach(edge => {
        selectionSet.add(edge.from);
        this.addAllParents(edge.from, selectionSet);
      });
    return [...selectionSet];
  }

  private addAllParents(node: NetworkNode, selectionSet: Set<number>) {
    const {edges, network} = this.state;

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.to === node)
      .forEach(edge => {
        if (!selectionSet.has(edge.from)) {
          selectionSet.add(edge.from);
          this.addAllParents(edge.from, selectionSet);
        }
      })
  }

  private findAllChildren(node: NetworkNode) {
    const {edges, network} = this.state;
    const selectionSet = new Set();

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.from === node)
      .forEach(edge => {
        selectionSet.add(edge.to);
        this.addAllChildren(edge.to, selectionSet);
      });
    return [...selectionSet];
  }

  private addAllChildren(node: NetworkNode, selectionSet: Set<number>) {
    const {edges, network} = this.state;

    network
      .getConnectedEdges(node)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => edge.from === node)
      .forEach(edge => {
        if (!selectionSet.has(edge.to)) {
          selectionSet.add(edge.to);
          this.addAllChildren(edge.to, selectionSet);
        }
      })
  }

  private cutDag(remainingNodeNumbers: IdType[]) {
    const {dag, historyLength, historyState, versionCount} = this.state;
    const remainingNodes: { [key: number]: SatNode } = {};

    remainingNodeNumbers.forEach(n => remainingNodes[n] = dag.get(n));
    this.setState({
      dag: new Dag(remainingNodes),
      versionCount: versionCount + 1,
      historyLength: historyLength,
      historyState: historyState
    });

  }

}

export default App;
