import * as React from 'react';
import {Component} from 'react';

import Main from './Main';
import Aside from './Aside';
import Dag from '../model/dag';
import SatNode from '../model/sat-node';
import './App.css';
import { assert } from '../model/util';
import { filterNonParents, filterNonConsequences, filterNonActiveDerivingNodes, mergePreprocessing } from '../model/transformations';
import { findCommonConsequences } from '../model/find-node';
import {VizWrapper} from '../model/viz-wrapper';

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
    if (!error && isLoaded) {
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
          onSelectCommonConsequences={this.selectCommonConsequences.bind(this)}
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

  async uploadFile(fileContent: string | ArrayBuffer) {
    this.setState({
      error: false,
      isLoading: true,
      isLoaded: false
    });

    const fetchedJSON = await fetch('http://localhost:5000', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({file: fileContent})
    });

    try {
      const result = await fetchedJSON.json();
      const dag = Dag.fromDto(result.dag);
      const filteredDag = filterNonActiveDerivingNodes(dag);
      const mergedDag = mergePreprocessing(filteredDag);

      await VizWrapper.layout(mergedDag);

      this.setState({
        dags: [mergedDag],
        nodeSelection: [],
        historyState: mergedDag.numberOfHistorySteps() - 1,
        error: false,
        isLoaded: true,
        isLoading: false
      });

    } catch (error) {
      this.setState({
        error,
        isLoaded: true,
        isLoading: false
      });
    }
  }


  // SUBGRAPH SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////

  undoLastStep() {
    this.popDag();
  }

  async renderParentsOnly() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    const newDag = filterNonParents(currentDag, new Set(nodeSelection));
    await VizWrapper.layout(newDag);

    this.pushDag(newDag);
  }

  async renderChildrenOnly() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    const newDag = filterNonConsequences(currentDag, new Set(nodeSelection));
    await VizWrapper.layout(newDag);

    this.pushDag(newDag);
  }


  // NODE SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////////

  selectParents() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    const newSelection: Set<number> = new Set(nodeSelection);
    for (const nodeId of nodeSelection) {
      for (const parentId of currentDag.get(nodeId).parents) {
        newSelection.add(parentId);
      }
    }

    this.updateNodeSelection(Array.from(newSelection));
  }

  selectChildren() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    const newSelection: Set<number> = new Set(nodeSelection);
    for (const nodeId of nodeSelection) {
      for (const childId of currentDag.getChildren(nodeId)) {
        newSelection.add(childId);
      }
    }

    this.updateNodeSelection(Array.from(newSelection));
  }

  selectCommonConsequences() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    const newSelection = findCommonConsequences(currentDag, new Set(nodeSelection));
    
    this.updateNodeSelection(newSelection);
  }


  // HELPERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // push a new dag on the stack of dags
  // Precondition: the layout for newDag has already been computed using VizWrapper.layout()
  private pushDag(newDag: Dag) {
    const {dags} = this.state;

    this.setState({
      dags: dags.concat([newDag]),
      historyState: dags[0].numberOfHistorySteps()-1,
    });
  }

  private popDag() {
    assert(this.state.dags.length > 1, "Undo last step must only be called if there exist at least two dags");

    this.setState((state, props) => ({
      dags: state.dags.slice(0, state.dags.length-1),
      historyState: state.dags[0].numberOfHistorySteps()-1 // TODO: construct history steps properly for each subgraph
    }));
  }
}

export default App;
