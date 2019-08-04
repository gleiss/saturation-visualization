import * as React from 'react';
import {Component} from 'react';
import {DataSet, Network} from 'vis';

import NetworkEdge from '../model/network/network-edge';
import NetworkNode from '../model/network/network-node';
import Main from './Main';
import Aside from './Aside';
import Dag from '../model/dag';
import SatNode from '../model/sat-node';
import './App.css';


type State = {
  dag: Dag,
  network: Network | null,
  nodes: DataSet<NetworkNode>,
  edges: DataSet<NetworkEdge>,
  nodeSelection: number[],
  historyLength: number,
  historyState: number,
  versionCount: number,
  error: any,
  isLoaded: boolean,
  isLoading: boolean
};

class App extends Component<{}, State> {

  state = {
    dag: new Dag({}),
    network: null,
    nodes: new DataSet([]),
    edges: new DataSet([]),
    nodeSelection: [],
    historyLength: 0,
    historyState: 0,
    versionCount: 0,
    error: null,
    isLoaded: false,
    isLoading: false
  };

  private versions: Dag[] = [];

  render() {
    const {
      dag,
      nodes,
      nodeSelection,
      historyLength,
      historyState,
      versionCount,
      error,
      isLoaded,
      isLoading
    } = this.state;
    let main;

    if (isLoaded && dag.hasNodes()) {
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
      const message = error ? `Error: ${error!['message']}` : 'Loading...';
      main = (
        <main>
          <section className="graph-placeholder">{message}</section>
          <section className="slider-placeholder"/>
        </main>
      );
    } else {
      main = (
        <main>
          <section className="graph-placeholder upload-info">Upload file →</section>
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

  setNetwork(network: Network, nodes: DataSet<NetworkNode>, edges: DataSet<NetworkEdge>) {
    this.setState({network, nodes, edges});
  }

  updateNodeSelection(nodeSelection: number[]) {
    this.setState({nodeSelection});
  }

  updateHistoryState(historyState: number) {
    this.setState({historyState});
  }


  // FILE UPLOAD ///////////////////////////////////////////////////////////////////////////////////////////////////////

  uploadFile(fileContent: string | ArrayBuffer) {
    this.setState({
      error: false,
      isLoading: true,
      isLoaded: false
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
          const dag = Dag.fromDto(result.dag);
          this.versions = [];
          this.setState({
            dag,
            nodeSelection: [],
            historyLength: dag.numberOfHistorySteps() - 1,
            historyState: dag.numberOfHistorySteps() - 1,
            versionCount: 0,
            error: false,
            isLoaded: true,
            isLoading: false
          });
        },
        (error) => {
          this.setState({
            error,
            isLoaded: true,
            isLoading: false
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

    const listsOfParents = nodeSelection.map(node => [...this.findAllParents(node)]);
    const parentNodesIncludingDuplicates = ([] as number[]).concat(...listsOfParents, ...nodeSelection);
    const parentNodes = [...new Set(parentNodesIncludingDuplicates)];

    this.versions.push(dag);
    this.cutDag(parentNodes);
  }

  renderChildrenOnly() {
    const {dag, nodeSelection} = this.state;

    const listsOfChildren = nodeSelection.map(node => [...this.findAllChildren(node)]);
    const childNodesIncludingDuplicates = ([] as number[]).concat(...listsOfChildren, ...nodeSelection);
    const childNodes = [...new Set(childNodesIncludingDuplicates)];

    this.versions.push(dag);
    this.cutDag(childNodes);
  }


  // NODE SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////////

  selectParents() {
    const {edges, network, nodeSelection} = this.state;
    const selectionSet: Set<number> = new Set(nodeSelection);

    if (!network) {
      return;
    }

    const currentNetwork = network! as Network;

    nodeSelection.forEach(node => {
      currentNetwork
        .getConnectedEdges(node)
        .map(edgeId => edges.get(edgeId))
        .filter(edge => !!edge)
        .map(edge => edge! as NetworkEdge)
        .filter(edge => edge.to === node)
        .forEach(edge => selectionSet.add(edge.from))
    });
    this.updateNodeSelection([...selectionSet]);
  }

  selectChildren() {
    const {network, edges, nodeSelection} = this.state;
    const selectionSet: Set<number> = new Set(nodeSelection);

    if (!network) {
      return;
    }

    const currentNetwork = network! as Network;

    nodeSelection.forEach(node => {
      currentNetwork
        .getConnectedEdges(node)
        .map(edgeId => edges.get(edgeId))
        .filter(edge => !!edge)
        .map(edge => edge! as NetworkEdge)
        .filter(edge => edge.from === node)
        .forEach(edge => selectionSet.add(edge.to))
    });
    this.updateNodeSelection([...selectionSet]);
  }

  findCommonConsequences() {
    const {nodeSelection} = this.state;

    const newNodeSelection = nodeSelection
      .map(node => this.findAllChildren(node))
      .map(childSet => [...childSet])
      .reduce((a, b) => a.filter(child => b.includes(child)));

    this.updateNodeSelection(newNodeSelection);
  }


  // HELPERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  private findAllParents(nodeId: number): Set<number> {
    const {edges, network} = this.state;
    const selectionSet: Set<number> = new Set();

    if (!network) {
      return selectionSet;
    }

    const currentNetwork = network! as Network;

    currentNetwork
      .getConnectedEdges(nodeId)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => !!edge)
      .map(edge => edge! as NetworkEdge)
      .filter(edge => edge.to === nodeId)
      .forEach(edge => {
        selectionSet.add(edge.from);
        this.addAllParents(edge.from, selectionSet);
      });
    return selectionSet;
  }

  private addAllParents(nodeId: number, selectionSet: Set<number>) {
    const {edges, network} = this.state;

    if (!network) {
      return;
    }

    const currentNetwork = network! as Network;

    currentNetwork
      .getConnectedEdges(nodeId)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => !!edge)
      .map(edge => edge! as NetworkEdge)
      .filter(edge => edge.to === nodeId)
      .forEach(edge => {
        if (!selectionSet.has(edge.from)) {
          selectionSet.add(edge.from);
          this.addAllParents(edge.from, selectionSet);
        }
      })
  }

  private findAllChildren(nodeId: number): Set<number> {
    const {edges, network} = this.state;
    const selectionSet: Set<number> = new Set();

    if (!network) {
      return selectionSet;
    }

    const currentNetwork = network! as Network;

    currentNetwork
      .getConnectedEdges(nodeId)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => !!edge)
      .map(edge => edge! as NetworkEdge)
      .filter(edge => edge.from === nodeId)
      .forEach(edge => {
        selectionSet.add(edge.to);
        this.addAllChildren(edge.to, selectionSet);
      });
    return selectionSet;
  }

  private addAllChildren(nodeId: number, selectionSet: Set<number>) {
    const {network, edges} = this.state;

    if (!network) {
      return;
    }

    const currentNetwork = network! as Network;

    currentNetwork
      .getConnectedEdges(nodeId)
      .map(edgeId => edges.get(edgeId))
      .filter(edge => !!edge)
      .map(edge => edge! as NetworkEdge)
      .filter(edge => edge.from === nodeId && !selectionSet.has(edge.to))
      .forEach(edge => {
        selectionSet.add(edge.to);
        this.addAllChildren(edge.to, selectionSet);
      });
  }

  private cutDag(remainingNodeNumbers: number[]) {
    const {dag, historyLength, historyState, versionCount} = this.state;
    const remainingNodes: { [key: number]: SatNode } = {};

    remainingNodeNumbers.forEach(n => remainingNodes[n] = dag.get(n));
    this.setState({
      dag: new Dag(remainingNodes),
      historyLength: historyLength,
      historyState: historyState,
      versionCount: versionCount + 1
    });

  }

}

export default App;
