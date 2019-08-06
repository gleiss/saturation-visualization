import * as React from 'react';
import {Component} from 'react';

import Main from './Main';
import Aside from './Aside';
import Dag from '../model/dag';
import SatNode from '../model/sat-node';
import './App.css';


type State = {
  dag: Dag,
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
          dag={dag}
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
    const {dag, nodeSelection} = this.state;
    const selectionSet: Set<number> = new Set(nodeSelection);

    nodeSelection.forEach(node => {
      dag.get(node).parents.forEach(parent => {
        selectionSet.add(parent);
      })
    });
    this.updateNodeSelection([...selectionSet]);
  }

  // TODO: update to children
  selectChildren() {
    const {dag, nodeSelection} = this.state;
    const selectionSet: Set<number> = new Set(nodeSelection);

    nodeSelection.forEach(node => {
      dag.get(node).parents.forEach(child => {
        selectionSet.add(child);
      })
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
    const {dag} = this.state;
    const selectionSet: Set<number> = new Set();

    dag.get(nodeId).parents.forEach(parent => {
      selectionSet.add(parent);
      this.addAllParents(parent, selectionSet);
    })
    
    return selectionSet;
  }

  private addAllParents(nodeId: number, selectionSet: Set<number>) {
    const {dag} = this.state;

    dag.get(nodeId).parents.forEach(parent => {
      if (!selectionSet.has(parent)) {
        selectionSet.add(parent);
        this.addAllParents(parent, selectionSet);
      }
    })
  }

  // TODO: children instead of parents
  private findAllChildren(nodeId: number): Set<number> {
    const {dag} = this.state;
    const selectionSet: Set<number> = new Set();

    dag.get(nodeId).parents.forEach(child => {
      selectionSet.add(child);
      this.addAllChildren(child, selectionSet);
    })
    
    return selectionSet;
  }

  private addAllChildren(nodeId: number, selectionSet: Set<number>) {
    const {dag} = this.state;

    dag.get(nodeId).parents.forEach(child => {
      if (!selectionSet.has(child)) {
        selectionSet.add(child);
        this.addAllChildren(child, selectionSet);
      }
    })
  }

  private cutDag(remainingNodeIds: number[]) {
    const {dag, historyLength, historyState, versionCount} = this.state;
    const remainingNodes: { [key: number]: SatNode } = {};

    remainingNodeIds.forEach(n => remainingNodes[n] = dag.get(n));
    this.setState({
      dag: new Dag(remainingNodes),
      historyLength: historyLength,
      historyState: historyState,
      versionCount: versionCount + 1
    });

  }

}

export default App;
