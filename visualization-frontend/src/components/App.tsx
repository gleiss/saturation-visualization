import * as React from 'react';
import {Component} from 'react';

import Main from './Main';
import Aside from './Aside';
import Dag from '../model/dag';
import SatNode from '../model/sat-node';
import './App.css';
import { assert } from '../model/util';

/* Invariant: the state is always in one of the following phases
 * "Waiting": error, isLoaded and isLoading are all false
 * "Error":   error holds an error, and there are no guarantees on other fields
 * "Loading": isLoading is true, and there are no guarantees on other fields
 * "Loaded":  isLoaded is true, error and isLoading are false, and dags, nodeSelection and historyState hold meaningful values.
 */
type State = {
  dags: Dag[],
  nodeSelection: number[],
  historyState: number,
  error: any,
  isLoaded: boolean,
  isLoading: boolean
};

class App extends Component<{}, State> {

  state: State = {
    dags: [],
    nodeSelection: [],
    historyState: 0,
    error: null,
    isLoaded: false,
    isLoading: false
  };

  render() {
    const {
      dags,
      nodeSelection,
      historyState,
      error,
      isLoaded,
      isLoading
    } = this.state;
    
    let main;
    // TODO: why doesn't it work for a dag without nodes?
    if (!error && isLoaded && dags[dags.length-1].hasNodes()) {
      const dag = dags[dags.length-1];
      main = (
        <Main
          dag={dag}
          nodeSelection={nodeSelection}
          historyLength={dags[0].numberOfHistorySteps()-1}
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
          <section className="graph-placeholder upload-info"><span>Upload file →</span></section>
          <section className="slider-placeholder"/>
        </main>
      );
    }

    return (
      <div className="app">
        {main}
        <Aside
          dag={dags[dags.length-1]}
          nodeSelection={nodeSelection}
          multipleVersions={dags.length > 1}
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
          this.setState({
            dags: [dag],
            nodeSelection: [],
            historyState: dag.numberOfHistorySteps() - 1,
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
    assert(this.state.dags.length > 1, "Undo last step must only be called if there exist at least two dags");

    this.setState((state, props) => ({
      dags: state.dags.slice(0, state.dags.length-1),
      historyState: state.dags[0].numberOfHistorySteps()-1 // TODO: construct history steps properly for each subgraph
    }));
  }

  renderParentsOnly() {
    const {nodeSelection} = this.state;

    const listsOfParents = nodeSelection.map(node => [...this.findAllParents(node)]);
    const parentNodesIncludingDuplicates = ([] as number[]).concat(...listsOfParents, ...nodeSelection);
    const parentNodes = [...new Set(parentNodesIncludingDuplicates)];

    this.createAndPushDag(parentNodes)
  }

  renderChildrenOnly() {
    const {nodeSelection} = this.state;

    const listsOfChildren = nodeSelection.map(node => [...this.findAllChildren(node)]);
    const childNodesIncludingDuplicates = ([] as number[]).concat(...listsOfChildren, ...nodeSelection);
    const childNodes = [...new Set(childNodesIncludingDuplicates)];

    this.createAndPushDag(childNodes);
  }


  // NODE SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////////

  selectParents() {
    const {dags, nodeSelection} = this.state;
    const selectionSet: Set<number> = new Set(nodeSelection);

    nodeSelection.forEach(node => {
      dags[dags.length - 1].get(node).parents.forEach(parent => {
        selectionSet.add(parent);
      })
    });
    this.updateNodeSelection([...selectionSet]);
  }

  selectChildren() {
    const {dags, nodeSelection} = this.state;
    const selectionSet: Set<number> = new Set(nodeSelection);

    nodeSelection.forEach(node => {
      dags[dags.length - 1].get(node).children.forEach(child => {
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
    const {dags} = this.state;
    const selectionSet: Set<number> = new Set();

    dags[dags.length - 1].get(nodeId).parents.forEach(parent => {
      selectionSet.add(parent);
      this.addAllParents(parent, selectionSet);
    })
    
    return selectionSet;
  }

  private addAllParents(nodeId: number, selectionSet: Set<number>) {
    const {dags} = this.state;

    dags[dags.length - 1].get(nodeId).parents.forEach(parent => {
      if (!selectionSet.has(parent)) {
        selectionSet.add(parent);
        this.addAllParents(parent, selectionSet);
      }
    })
  }

  private findAllChildren(nodeId: number): Set<number> {
    const {dags} = this.state;
    const selectionSet: Set<number> = new Set();

    dags[dags.length - 1].get(nodeId).children.forEach(child => {
      selectionSet.add(child);
      this.addAllChildren(child, selectionSet);
    });
    
    return selectionSet;
  }

  private addAllChildren(nodeId: number, selectionSet: Set<number>) {
    const {dags} = this.state;

    dags[dags.length - 1].get(nodeId).children.forEach(child => {
      if (!selectionSet.has(child)) {
        selectionSet.add(child);
        this.addAllChildren(child, selectionSet);
      }
    })
  }

  private createAndPushDag(remainingNodeIds: number[]) {
    const {dags} = this.state;
    
    const remainingNodes: { [key: number]: SatNode } = {};
    remainingNodeIds.forEach(n => remainingNodes[n] = dags[dags.length-1].get(n));
    const newDag = new Dag(remainingNodes);

    this.setState({
      dags: dags.concat([newDag]),
      historyState: dags[0].numberOfHistorySteps()-1,
    });
  }

}

export default App;
