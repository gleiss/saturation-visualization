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
import { orientClauses } from '../model/clause-orientation';

type Props = {
  problem: string,
  vampireUserOptions: string,
  mode: "proof" | "saturation" | "manualcs"
  hideBracketsAssoc: boolean,
  nonStrictForNegatedStrictInequalities: boolean, 
  orientClauses: boolean,
};

/* Invariant: the state is always in one of the following phases
 *    "loaded": A dag is loaded. Clause selection is not possible. dags, nodeSelection and currentTime hold meaningful values.
 *    "loaded selected": Same as "loaded", but clause selection is possible.
 *    "waiting": Waiting for answer from Vampire server. message holds a meaningful value.
 *    "layouting": Layouting a dag. message holds a meaningful value.
 *    "error": Some error occured. message holds a meaningful value.
 */
type State = {
  state: "loaded" | "loaded select" | "waiting" | "layouting" | "error",
  dags: Dag[],
  nodeSelection: number[],
  currentTime: number,
  changedNodeEvent?: [number, number], // update to trigger refresh of node in graph. Event is of the form [eventId, nodeId]
  message: string,
};

class App extends Component<Props, State> {

  state: State = {
    state: "waiting",
    dags: [],
    nodeSelection: [],
    currentTime: 0,
    changedNodeEvent: undefined,
    message: ""
  };

  render() {
    const {
      state,
      dags,
      nodeSelection,
      currentTime,
      changedNodeEvent,
      message
    } = this.state;
    
    let dag;
    let main;
    if (state === "loaded" || state === "loaded select") {
      assert(dags.length > 0);
      dag = dags[dags.length-1];
      main = (
        <Main
          dag={dag}
          nodeSelection={nodeSelection}
          changedNodeEvent={changedNodeEvent}
          historyLength={dags[0].maximalActiveTime()}
          currentTime={currentTime}
          onNodeSelectionChange={this.updateNodeSelection.bind(this)}
          onCurrentTimeChange={this.updateCurrentTime.bind(this)}
          onShowPassiveDag={this.showPassiveDag.bind(this)}
          onDismissPassiveDag={this.dismissPassiveDag.bind(this)}
          onUpdateNodePosition={this.updateNodePosition.bind(this)}
        />
      );
    } else {
      dag = null;
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
          dag={dag}
          currentTime={currentTime}
          nodeSelection={nodeSelection}
          multipleVersions={dags.length > 1}
          onUpdateNodeSelection={this.updateNodeSelection.bind(this)}
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

  async componentDidMount() {

    // call Vampire on given input problem
    await this.runVampire(this.props.problem, this.props.vampireUserOptions, this.props.mode);

    if (this.state.state === "loaded select" && this.props.mode === "manualcs") {
      this.selectFinalPreprocessingClauses();
    }
  }


  // NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateNodeSelection(nodeSelection: number[]) {
    this.setState({nodeSelection: nodeSelection});
  }

  updateCurrentTime(currentTime: number) {
    const dags = this.state.dags
    assert(dags.length > 0);
    const dag = dags[dags.length - 1];

    const nodesInActiveDag = dag.computeNodesInActiveDag(currentTime);
    const nodeSelection = new Array<number>();
    for (const nodeId of this.state.nodeSelection) {
      if (nodesInActiveDag.has(nodeId)) {
        nodeSelection.push(nodeId);
      }
    }
    this.setState({
      nodeSelection: nodeSelection,
      currentTime: currentTime
    });
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

  async runVampire(problem: string, vampireUserOptions: string, mode: "proof" | "saturation" | "manualcs") {
    this.setState({
      state: "waiting",
      message: "Waiting for Vampire...",
      dags: [],
      nodeSelection: [],
      currentTime: 0
    });

    const fetchedJSON = await fetch(mode === "manualcs" ? 'http://localhost:5000/vampire/startmanualcs' : 'http://localhost:5000/vampire/start', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: problem, 
        vampireUserOptions: vampireUserOptions
      })
    });

    try {
      const json = await fetchedJSON.json();

      if (json.status === "success") {
        assert(json.vampireState === "running" ||
          json.vampireState === "refutation" ||
          json.vampireState === "saturation" ||
          json.vampireState === "timeout");

        if (mode === "proof") {
          assert(json.vampireState !== "running")
          if (json.vampireState === "saturation") {
            this.setState({
              state: "error",
              message: "Saturation: Vampire saturated, so there exists no proof!",
              dags: [],
              nodeSelection: [],
              currentTime: 0
            });
            return;
          }
          if (json.vampireState === "timeout") {
            this.setState({
              state: "error",
              message: "Timeout: Vampire could not find a proof in the given time!",
              dags: [],
              nodeSelection: [],
              currentTime: 0
            });
            return;
          }
        }
        const parsedLines = this.jsonToParsedLines(json);

        let dag = Dag.fromParsedLines(parsedLines, null);
        dag = mergePreprocessing(dag);

        if (mode === "proof") {
          assert(dag.isRefutation);
          // find empty clause
          for (const node of dag.nodes.values()) {
            if (node.unit.type === "Clause") {
              const clause = node.unit as Clause;
              if (clause.premiseLiterals.length === 0 && clause.conclusionLiterals.length === 0) {

                // filter all non-parents of empty clause
                const relevantIds = new Set<number>();
                relevantIds.add(node.id);
                dag = filterNonParents(dag, relevantIds);
                break;
              }
            }
          }
        }
  
        await VizWrapper.layoutDag(dag, true);

        if (this.props.orientClauses) {
          orientClauses(dag);
        }
        this.setLiteralOptions(dag);

        const state = (mode == "manualcs" && json.vampireState === "running") ? "loaded select" : "loaded";
        this.setState({
          state: state,
          dags: [dag],
          nodeSelection: [],
          currentTime: dag.maximalActiveTime()
        });
      } else {
        assert(json.status === "error");
        const errorMessage = json.message;
        assert(errorMessage !== undefined && errorMessage !== null);
        this.setState({
          state: "error",
          message: errorMessage,
          dags: [],
          nodeSelection: [],
          currentTime: 0
        });
      }
    } catch (error) {
      if (error.name === "SatVisAssertionError") {
        throw error;
      }
      this.setState({
        state: "error",
        message: `Error: ${error["message"]}`,
        dags: [],
        nodeSelection: [],
        currentTime: 0
      });
    }
  }

  // select the clause with id 'selectedId', then compute incremental layout for resulting dag
  async selectClause(selectedId: number, positioningHint: [number, number]) {
    assert(this.state.dags.length >= 1);
    const currentDag = this.state.dags[this.state.dags.length-1];
    const currentDagActiveNodes = currentDag.computeNodesInActiveDag(currentDag.maximalActiveTime()); // needs to be computed before dag is extended, since nodes are shared
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

    try {
      const json = await fetchedJSON.json();
      if (json.status === "success") {
        const parsedLines = this.jsonToParsedLines(json);

        // extend existing dag with new saturation events from server
        const newDag = Dag.fromParsedLines(parsedLines, currentDag);

        // compute which nodes have been newly generated
        const newDagActiveNodes = newDag.computeNodesInActiveDag(newDag.maximalActiveTime());
        const newNodes = new Map<number, SatNode>();
        for (const [nodeId, node] of newDag.nodes) {
          if(!currentDagActiveNodes.has(nodeId) && newDagActiveNodes.has(nodeId)) {
            newNodes.set(nodeId, node);
          }
        }

        if (newNodes.size > 0) {
          await VizWrapper.layoutNodesAtPosition(newNodes, positioningHint);
        }

        if (this.props.orientClauses) {
          orientClauses(newDag);
        }
        this.setLiteralOptions(newDag);
  
        const state = json.vampireState === "running" ? "loaded select" : "loaded";
        this.setState({
          state: state,
          dags: [newDag],
          nodeSelection: [],
          currentTime: newDag.maximalActiveTime(),
        });
      } else {
        assert(json.status === "error");
        const errorMessage = json.message;
        assert(errorMessage !== undefined && errorMessage !== null);
        this.setState({
          state: "error",
          message: errorMessage,
          dags: [],
          nodeSelection: [],
          currentTime: 0
        });
      }
    } catch (error) {
      if (error.name === "SatVisAssertionError") {
        throw error;
      }
      this.setState({
        state: "error",
        message: `Error: ${error["message"]}`,
        dags: [],
        nodeSelection: [],
        currentTime: 0
      });
    }
  }

  async selectFinalPreprocessingClauses() {
    // iterate as long as the server waits for clause selections and as long as a suitable clause is found
    let stop = false;
    while (this.state.state === "loaded select" && !stop) {
      const dag = this.state.dags[0];

      // find a final preprocessing clause which can be selected
      stop = true;
      for (const [nodeId, node] of dag.nodes) {
        if (node.isFromPreprocessing && node.newTime !== null) {
          if (node.activeTime === null && node.deletionTime === null) {
            // select that clause
            assert(node.position !== null);
            await this.selectClause(nodeId, node.position as [number, number]);
            stop = false;
            break;
          }
        }
      }
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

  setLiteralOptions(dag: Dag) {
    const hideBracketsAssoc = this.props.hideBracketsAssoc;
    const nonStrictForNegatedStrictInequalities = this.props.nonStrictForNegatedStrictInequalities;

    for (const node of dag.nodes.values()) {
      if (node.unit.type === "Clause") {
        const clause = node.unit as Clause;
        for (const literal of clause.premiseLiterals) {
          literal.hideBracketsAssoc = hideBracketsAssoc;
          literal.nonStrictForNegatedStrictInequalities = nonStrictForNegatedStrictInequalities;
        }
        for (const literal of clause.conclusionLiterals) {
          literal.hideBracketsAssoc = hideBracketsAssoc;
          literal.nonStrictForNegatedStrictInequalities = nonStrictForNegatedStrictInequalities;
        }
      }
    }
  }
}

export default App;
