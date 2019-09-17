import * as React from 'react';
import {Component} from 'react';

import Main from './Main';
import Aside from './Aside';
import { Dag, ParsedLine } from '../model/dag';
import SatNode from '../model/sat-node';
import './App.css';
import { assert } from '../model/util';
import { filterNonParents, filterNonConsequences, mergePreprocessing, passiveDagForSelection } from '../model/transformations';
import { findCommonConsequences } from '../model/find-node';
import { VizWrapper } from '../model/viz-wrapper';
import { Clause } from '../model/unit';
import { Literal } from '../model/literal';

/* Invariant: the state is always in one of the following phases
 * "Waiting": error, isLoaded and isLoading are all false
 * "Error":   error holds an error, and there are no guarantees on other fields
 * "Loading": isLoading is true, and there are no guarantees on other fields
 * "Loaded":  isLoaded is true, error and isLoading are false, and dags, nodeSelection and historyState hold meaningful values.
 */
type State = {
  dags: Dag[],
  nodeSelection: number[],
  changedNodeEvent?: [number, number], // update to trigger refresh of node in graph. Event is of the form [eventId, nodeId]
  historyState: number,
  error: any,
  isLoaded: boolean,
  isLoading: boolean
};

class App extends Component<{}, State> {

  state: State = {
    dags: [],
    nodeSelection: [],
    changedNodeEvent: undefined,
    historyState: 0,
    error: null,
    isLoaded: false,
    isLoading: false
  };

  render() {
    const {
      dags,
      nodeSelection,
      changedNodeEvent,
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
          changedNodeEvent={changedNodeEvent}
          historyLength={dags[0].numberOfHistorySteps()}
          historyState={historyState}
          onNodeSelectionChange={this.updateNodeSelection.bind(this)}
          onHistoryStateChange={this.updateHistoryState.bind(this)}
          onShowPassiveDag={this.showPassiveDag.bind(this)}
          onDismissPassiveDag={this.dismissPassiveDag.bind(this)}
          onUpdateNodePosition={this.updateNodePosition.bind(this)}
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
          onUploadFile={this.runVampire.bind(this)}
          onUndo={this.undoLastStep.bind(this)}
          onRenderParentsOnly={this.renderParentsOnly.bind(this)}
          onRenderChildrenOnly={this.renderChildrenOnly.bind(this)}
          onSelectParents={this.selectParents.bind(this)}
          onSelectChildren={this.selectChildren.bind(this)}
          onSelectCommonConsequences={this.selectCommonConsequences.bind(this)}
          onLiteralOrientationChange={this.changeLiteralOrientation.bind(this)}
          onLiteralRepresentationChange={this.changeLiteralRepresentation.bind(this)}
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
  jsonToParsedLines(json: any): Array<ParsedLine> {
    const parsedLines = new Array<ParsedLine>();
    for (const line of json.lines) {
      const statistics = new Map<string,number>();
      for (const key in line.statistics) {
        const val = line.statistics[key];
        if (typeof val === "number"){
          statistics.set(key, val);
        }
      }
      parsedLines.push(new ParsedLine(line.lineType, line.unitId, line.unitString, line.inferenceRule, line.parents, statistics));
    }
    return parsedLines;
  }

  async runVampire(fileContent: string | ArrayBuffer, manualCS=false) {
    this.setState({
      error: false,
      isLoading: true,
      isLoaded: false
    });

    manualCS = true
    const fetchedJSON = await fetch(manualCS ? 'http://localhost:5000/vampire/startmanualcs' : 'http://localhost:5000/vampire/start', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({file: fileContent})
    });

    // try {
      const json = await fetchedJSON.json();
      const parsedLines = this.jsonToParsedLines(json);

      const dag = Dag.fromParsedLines(parsedLines, null);
      const mergedDag = mergePreprocessing(dag);

      await VizWrapper.layoutDag(mergedDag, true);

      this.setState({
        dags: [mergedDag],
        nodeSelection: [],
        historyState: mergedDag.numberOfHistorySteps(),
        error: false,
        isLoaded: true,
        isLoading: false
      });

    // } catch (error) {
    //   this.setState({
    //     error,
    //     isLoaded: true,
    //     isLoading: false
    //   });
    // }
  }

  // select the clause with id 'selectedId', then compute incremental layout for resulting dag
  // the incremental layout first computes the positions for the newly generated nodes while ignoring the existing ones.
  // then, all newly generated nodes are shifted by the same amount so that one of the source nodes of the graph of newly 
  // generated nodes occurs closely under the position indicated by the positioning hint.
  async selectClause(selectedId: number, positioningHint: [number, number]) {
    assert(this.state.dags.length >= 1);
    const currentDag = this.state.dags[this.state.dags.length-1];
    const currentDagActiveNodes = currentDag.computeNodesInActiveDag(currentDag.numberOfHistorySteps()); // needs to be computed before dag is extended, since nodes are shared
    assert(currentDag.mergeMap !== null);

    // ask server to select clause and await resulting saturation events
    const fetchedJSON = await fetch('http://localhost:5000/vampire/select', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({id: selectedId})
    });

    // try {
      const json = await fetchedJSON.json();
      const parsedLines = this.jsonToParsedLines(json);

      // extend existing dag with new saturation events from server
      const newDag = Dag.fromParsedLines(parsedLines, currentDag);

      // compute which nodes have been newly generated
      const newDagActiveNodes = newDag.computeNodesInActiveDag(newDag.numberOfHistorySteps());
      const newNodes = new Map<number, SatNode>();
      for (const [nodeId, node] of newDag.nodes) {
        if(!node.isFromPreprocessing && newDagActiveNodes.has(nodeId) && !currentDagActiveNodes.has(nodeId)) {
          newNodes.set(nodeId, node);
        }
      }

      if (newNodes.size > 0) {
        // compute incremental layout for newly generated nodes using the following heuristic:
        // 1) layout new nodes while ignoring existing nodes
        await VizWrapper.layoutNodes(newNodes);

        // 2) find a source node of the dag of newly generated nodes
        let sourceNode: SatNode | null = null;
        for (const node of newNodes.values()) {
          let isSourceNode = true;
          for (const parentId of node.parents) {
            if (newNodes.has(parentId)) {
              isSourceNode = false;
              break;
            }
          }
          if (isSourceNode) {
            sourceNode = node;
            break;
          }
        }
        assert(sourceNode !== null);
        assert((sourceNode as SatNode).position !== null);

        // 3) shift subgraph of newly generated nodes, so that the source node of the subgraph
        //    is shifted to a position closely under the position indicated by the positioning hint.
        const [posSelectedX, posSelectedY] = positioningHint;
        const [posSourceX, posSourceY] = (sourceNode as SatNode).position as [number, number];
        const deltaX = posSelectedX-posSourceX;
        const deltaY = (posSelectedY - posSourceY) - 1;
        for (const node of newNodes.values()) {
          assert(node.position != null);
          const position = node.position as [number, number];
          node.position = [position[0] + deltaX, position[1] + deltaY];
        }
      }

      this.setState({
        dags: [newDag],
        nodeSelection: [],
        historyState: newDag.numberOfHistorySteps(),
        error: false,
        isLoaded: true,
        isLoading: false
      });
    // } catch (error) {
    //   this.setState({
    //     error,
    //     isLoaded: true,
    //     isLoading: false
    //   });
    // }
  }


  // SUBGRAPH SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////

  undoLastStep() {
    this.popDag();
  }

  async renderParentsOnly() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    const newDag = filterNonParents(currentDag, new Set(nodeSelection));
    await VizWrapper.layoutDag(newDag, true);

    this.pushDag(newDag);
  }

  async renderChildrenOnly() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    const newDag = filterNonConsequences(currentDag, new Set(nodeSelection));
    await VizWrapper.layoutDag(newDag, true);

    this.pushDag(newDag);
  }

  // PASSIVE DAG ////////////////////////////////////////////////////////////////////////////////////////////////////

  async showPassiveDag(selectionId: number, currentTime: number) {
    const {dags} = this.state;
    const currentDag = dags[dags.length - 1];
    
    const passiveDag = passiveDagForSelection(currentDag, selectionId, currentTime);
    await VizWrapper.layoutDag(passiveDag, false);

    // shift dag so that selected node keeps position
    const [posCurrentX, posCurrentY] = currentDag.get(selectionId).getPosition();
    const [posPassiveX, posPassiveY] = passiveDag.get(selectionId).getPosition();
    const deltaX = posCurrentX-posPassiveX;
    const deltaY = posCurrentY-posPassiveY;
    for (const [nodeId, node] of passiveDag.nodes) {
      assert(node.position != null);
      const position = node.position as [number, number];
      node.position = [position[0] + deltaX, position[1] + deltaY];
    }

    this.pushDag(passiveDag);
  }

  async dismissPassiveDag(selectedId: number) {
    assert(this.state.dags.length >= 2 && this.state.dags[this.state.dags.length-1].isPassiveDag, "dismissPassiveDag() must only be called while a passive dag is the topmost dag of this.state.dags");
    const passiveDag = this.state.dags[this.state.dags.length-1];
    assert(passiveDag.isPassiveDag);
    const currentDag = this.state.dags[this.state.dags.length-2];
    
    const positioningHint = currentDag.get(passiveDag.activeNodeId as number).position;
    assert(positioningHint !== null);
  
    this.popDag();

    // switch to dag resulting from selecting selectedId
    await this.selectClause(selectedId, positioningHint as [number, number]);
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

  // LITERALS ////////////////////////////////////////////////////////////////////////////////////////////////////////

  private changeLiteralOrientation(nodeId: number, oldPosition: [boolean, number], newPosition: [boolean, number]) {
    const dags = this.state.dags;
    assert(dags.length > 0);
    const node = dags[0].nodes.get(nodeId);
    assert(node !== undefined);
    assert(node!.unit.type === "Clause");
    const clause = node!.unit as Clause;

    clause.changeLiteralOrientation(oldPosition, newPosition);
  
    this.setState({changedNodeEvent: [Math.random(), nodeId]});
  }

  private changeLiteralRepresentation(nodeId: number, literal: Literal) {
    const dags = this.state.dags;
    assert(dags.length > 0);
    const node = dags[0].nodes.get(nodeId);
    assert(node !== undefined);

    literal.switchToNextRepresentation();
    
    this.setState({changedNodeEvent: [Math.random(), nodeId]});
  }

  // HELPERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  updateNodePosition(nodeId: number, delta: [number, number]) {
    const dags = this.state.dags
    assert(this.state.dags.length > 0);
    const dag = dags[dags.length - 1];
    const node = dag.get(nodeId);
    assert(node.position !== null);

    node.position = [node.position![0] + delta[0], node.position![1] + delta[1]];
  }

  // push a new dag on the stack of dags
  // Precondition: the layout for newDag has already been computed
  private pushDag(newDag: Dag) {
    const {dags, nodeSelection} = this.state;
    
    // filter out selected nodes which don't occur in new graph
    const selectedNodesInNewDag = new Array<number>();
    for (const nodeId of nodeSelection) {
      if (newDag.nodes.has(nodeId)) {
        selectedNodesInNewDag.push(nodeId);
      }
    }

    this.setState({
      dags: dags.concat([newDag]),
      nodeSelection: selectedNodesInNewDag
    });
  }

  private popDag() {
    assert(this.state.dags.length > 1, "Undo last step must only be called if there exist at least two dags");

    this.setState((state, props) => ({
      dags: state.dags.slice(0, state.dags.length-1)
    }));
  }
}

export default App;
