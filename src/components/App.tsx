import * as React from 'react';
import {Component} from 'react';

import Main from './Main';
import Aside from './Aside';
import {Dag, ParsedLine} from '../model/dag';
import SatNode from '../model/sat-node';
import './App.css';
import {assert} from '../model/util';
import {filterNonConsequences, filterNonParents, mergePreprocessing} from '../model/transformations';
import {findCommonConsequences} from '../model/find-node';
import {VizWrapper} from '../model/viz-wrapper';
import {Clause} from '../model/unit';
import {Literal} from '../model/literal';
import {computeClauseRepresentation, computeParentLiterals} from '../model/clause-orientation';
import {Serializer} from '../model/serialization';

export enum AppMode {
  'proof',
  'saturation',
  'manualcs',
  'saved'
}

type Props = {
  problem: string,
  loadedProblem?: string,
  vampireUserOptions: string,
  mode: AppMode,
  hideBracketsAssoc: boolean,
  nonStrictForNegatedStrictInequalities: boolean, 
  orientClauses: boolean,
  logging: boolean
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
  animateDagChanges,
  changedNodesEvent?: Set<number>, // update to trigger refresh of node in graph. Event is of the form [eventId, nodeId]
  message: string,
  showPassiveDag: boolean
  nodeIdToActivate: number | null,
  infoToggle: boolean,
  editToggle: boolean
}

class App extends Component<Props, State> {

  state: State = {
    state: "waiting",
    dags: [],
    nodeSelection: [],
    currentTime: 0,
    animateDagChanges: false,
    changedNodesEvent: undefined,
    message: "",
    showPassiveDag: false,
    nodeIdToActivate: null,
    infoToggle: false,
    editToggle: false,
  };

  render() {
    const {
      state,
      dags,
      nodeSelection,
      currentTime,
      animateDagChanges,
      changedNodesEvent,
      message,
      showPassiveDag
    } = this.state;
    
    let dag;
    let main;
    if (state === "loaded" || state === "loaded select") {
      assert(dags.length > 0);
      dag = dags[dags.length-1];
      main = (
        <Main
          dag={dag}
          showPassiveDag={showPassiveDag}
          nodeSelection={nodeSelection}
          changedNodesEvent={changedNodesEvent}
          historyLength={dags[0].maximalActiveTime()}
          currentTime={currentTime}
          animateDagChanges={animateDagChanges}
          infoToggle={this.state.infoToggle}
          editToggle={this.state.editToggle}
          readOnly={this.props.mode === AppMode.saved}
          onNodeSelectionChange={this.updateNodeSelection.bind(this)}
          onCurrentTimeChange={this.updateCurrentTime.bind(this)}
          onDismissPassiveDag={this.dismissPassiveDag.bind(this)}
          onUpdateNodePositions={this.updateNodePositions.bind(this)}
          onLiteralOrientationChange={this.changeLiteralOrientation.bind(this)}
          onLiteralRepresentationChange={this.changeLiteralRepresentation.bind(this)}
          onToggleInfo={this.toggleInfo.bind(this)}
          onToggleEdit={this.toggleEdit.bind(this)}
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
          infoToggle={this.state.infoToggle}
          editToggle={this.state.editToggle}
          readOnly={this.props.mode === AppMode.saved}
          onUpdateNodeSelection={this.updateNodeSelection.bind(this)}
          onUndo={this.undoLastStep.bind(this)}
          onRenderParentsOnly={this.renderParentsOnly.bind(this)}
          onRenderChildrenOnly={this.renderChildrenOnly.bind(this)}
          onShowPassiveDag={this.showPassiveDag.bind(this)}
          onSelectParents={this.selectParents.bind(this)}
          onSelectChildren={this.selectChildren.bind(this)}
          onSelectCommonConsequences={this.selectCommonConsequences.bind(this)}
          onLiteralOrientationChange={this.changeLiteralOrientation.bind(this)}
          onLiteralRepresentationChange={this.changeLiteralRepresentation.bind(this)}
          onToggleInfo={this.toggleInfo.bind(this)}
          onToggleEdit={this.toggleEdit.bind(this)}
        />
      </div>
    );

  }

  async componentDidMount() {
    if (this.props.mode === AppMode.saved) {
      // render 'read-only' mode
      const [, , , dag] = Serializer.deserializeAppState(this.props.loadedProblem || '{}');
      this.setState({
        state: 'loaded',
        dags: [dag],
        nodeSelection: [],
        currentTime: dag.maximalActiveTime(),
        animateDagChanges: false
      });
    } else {
      // call Vampire on given input problem
      await this.runVampire(this.props.problem, this.props.vampireUserOptions, this.props.mode);

      if (this.state.state === 'loaded select' && this.props.mode === AppMode.manualcs) {
        this.selectFinalPreprocessingClauses();
      }
    }
  }

  // LOAD AND SAVE /////////////////////////////////////////////////////////////////////////////////////////////////////

  serialize(): string {
    assert(this.state.state === "loaded" || this.state.state === "loaded select");
    assert(this.state.dags.length > 0);

    return Serializer.serializeAppState(this.props.problem, this.props.vampireUserOptions, this.state.dags[0]);
  }

  // NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateNodeSelection(nodeSelection: number[]) {
    if (this.props.logging) {
      console.log(`Updating node selection to [${nodeSelection.toString()}]`);
    }
    this.setState({nodeSelection: nodeSelection});
  }

  updateCurrentTime(currentTime: number) {
    if (this.props.logging) {
      console.log(`Updating current time to ${currentTime}`);
    }
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

  async runVampire(problem: string, vampireUserOptions: string, mode: AppMode) {
    assert(mode !== AppMode.saved, 'Saved mode does not require vampire.');

    this.setState({
      state: "waiting",
      message: "Waiting for Vampire...",
      dags: [],
      nodeSelection: [],
      currentTime: 0
    });

    const url = mode === AppMode.manualcs ? 'http://localhost:5000/vampire/startmanualcs' : 'http://localhost:5000/vampire/start';
    if (this.props.logging) {
      console.log(`Starting request to url '${url}' with Vampire-user-options '${vampireUserOptions}'.`);
    }
    const fetchedJSON = await fetch(url, {
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

      if (this.props.logging) {
        console.log(`Received response from Vampire server.`);
      }
      if (json.status === "success") {
        assert(json.vampireState === "running" ||
          json.vampireState === "refutation" ||
          json.vampireState === "saturation" ||
          json.vampireState === "timeout");

        if (mode === AppMode.proof) {
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
        } else {
          if (json.vampireState === "saturation" && json.lines.length === 0) {
            this.setState({
              state: "error",
              message: "The example was already identified to be satisfiable during Vampire's preprocessing.",
              dags: [],
              nodeSelection: [],
              currentTime: 0
            });
            return;
          }
        }
        if (this.props.logging) {
          console.log(`Constructing Vampire-saturation-events from received JSON.`);
        }
        const parsedLines = this.jsonToParsedLines(json);

        if (this.props.logging) {
          console.log(`Constructing saturation graph from Vampire-saturation-events.`);
        }
        let dag = Dag.fromParsedLines(parsedLines, null);

        if (this.props.logging) {
          console.log(`Merging preprocessing-subgraph of saturation graph.`);
        }
        dag = mergePreprocessing(dag);

        if (mode === AppMode.proof) {
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
        if (this.props.logging) {
          console.log(`Computing layout for saturation graph.`);
        }
        await VizWrapper.layoutDag(dag, true);

        if (this.props.orientClauses) {
          if (this.props.logging) {
            console.log(`Computing literal flows for saturation graph.`);
          }
          computeParentLiterals(dag);
          if (this.props.logging) {
            console.log(`Computing clause representations for saturation graph.`);
          }
          computeClauseRepresentation(dag, null);
        }
        this.setLiteralOptions(dag);

        const state = (mode == AppMode.manualcs && json.vampireState === "running") ? "loaded select" : "loaded";

        this.setState({
          state: state,
          dags: [dag],
          nodeSelection: [],
          currentTime: dag.maximalActiveTime(),
          animateDagChanges: false
        });
        if (this.props.logging) {
          console.log(`Finished preparation of saturation graph.`);
        }
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
    const url = 'http://localhost:5000/vampire/select';
    if (this.props.logging) {
      console.log(`Starting request to url '${url}' with selected-id '${selectedId}'.`);
    }
    const fetchedJSON = await fetch(url, {
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
      if (this.props.logging) {
        console.log(`Received response from Vampire server.`);
      }
      if (json.status === "success") {
        if (this.props.logging) {
          console.log(`Constructing Vampire-saturation-events from received JSON.`);
        }
        const parsedLines = this.jsonToParsedLines(json);

        // extend existing dag with new saturation events from server
        if (this.props.logging) {
          console.log(`Extending existing saturation graph with Vampire-saturation-events.`);
        }
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
          if (this.props.logging) {
            console.log(`Extending layout to new nodes of saturation graph.`);
          }
          await VizWrapper.layoutNodesAtPosition(newNodes, positioningHint);
        }

        if (this.props.orientClauses) {
          if (this.props.logging) {
            console.log(`Updating literal flows for saturation graph.`);
          }
          computeParentLiterals(newDag);
          if (this.props.logging) {
            console.log(`Updating clause representations for saturation graph.`);
          }
          computeClauseRepresentation(newDag, null);
        }
        this.setLiteralOptions(newDag);
  
        const state = json.vampireState === "running" ? "loaded select" : "loaded";
        const nodeSelection = new Array<number>();
        for (const nodeId of newNodes.keys()) {
          nodeSelection.push(nodeId);
        }
        this.setState({
          state: state,
          dags: [newDag],
          nodeSelection: nodeSelection,
          currentTime: newDag.maximalActiveTime(),
          animateDagChanges: true
        });
        if (this.props.logging) {
          console.log(`Finished extension of saturation graph.`);
        }
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
    if (this.props.logging) {
      console.log(`Starting to select all clauses from preprocessing.`);
    }
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
    if (this.props.logging) {
      console.log(`Finished to select all clauses from preprocessing.`);
    }
  }

  // SUBGRAPH SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////

  undoLastStep() {
    if (this.props.logging) {
      console.log(`Pop last saturation graph from the stack.`);
    }
    this.popDag();
  }

  async renderParentsOnly() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    if (this.props.logging) {
      console.log(`Generate saturation graph which consists only of the (transitive) parents of clauses [${nodeSelection}].`);
    }
    const newDag = filterNonParents(currentDag, new Set(nodeSelection));
    if (this.props.logging) {
      console.log(`Computing layout for new saturation graph.`);
    }
    await VizWrapper.layoutDag(newDag, true);

    if (this.props.logging) {
      console.log(`Finished preparation of new saturation graph. Pushing it to the stack.`);
    }
    this.pushDag(newDag);
  }

  async renderChildrenOnly() {
    const {dags, nodeSelection} = this.state;
    const currentDag = dags[dags.length - 1];

    if (this.props.logging) {
      console.log(`Generate saturation graph which consists only of the (transitive) children of clauses [${nodeSelection}].`);
    }
    const newDag = filterNonConsequences(currentDag, new Set(nodeSelection));
    if (this.props.logging) {
      console.log(`Computing layout for new saturation graph.`);
    }
    await VizWrapper.layoutDag(newDag, true);

    if (this.props.logging) {
      console.log(`Finished preparation of new saturation graph. Pushing it to the stack.`);
    }
    this.pushDag(newDag);
  }

  // PASSIVE DAG ////////////////////////////////////////////////////////////////////////////////////////////////////

  async showPassiveDag() {
    assert(this.state.showPassiveDag === false);
    assert(this.state.nodeSelection.length > 0);

    if (this.props.logging) {
      console.log(`Display selection graph containing all clauses which can be selected for activation and whose derivation contains all the clauses [${this.state.nodeSelection}].`);
    }
    this.setState({showPassiveDag: true});
  }

  async dismissPassiveDag(selectedId: number | null, positioningHint: [number, number] | null) {
    assert((selectedId === null) === (positioningHint === null));
    assert(this.state.showPassiveDag === true);

    // remove passive dag
    this.setState({ showPassiveDag: false});

    if (selectedId !== null) {
      // switch from currentDag to dag resulting from selecting nodeIdToActivate
      if (this.props.logging) {
        console.log(`Removing selection graph. Clause ${selectedId} was selected.`);
      }
      await this.selectClause(selectedId, positioningHint!);
    } else {
      if (this.props.logging) {
        console.log(`Removing selection graph. No clause was selected.`);
      }
    }
  }


  // NODE SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////////

  selectParents() {
    const {dags, nodeSelection, currentTime} = this.state;
    const currentDag = dags[dags.length - 1];
    const nodesInActiveDag = currentDag.computeNodesInActiveDag(currentTime);

    const newSelection = new Set(nodeSelection);
    for (const nodeId of nodeSelection) {
      assert(nodesInActiveDag.has(nodeId));
      for (const parentId of currentDag.get(nodeId).parents) {
        if(nodesInActiveDag.has(parentId)) {
          newSelection.add(parentId);
        }
      }
    }

    this.updateNodeSelection(Array.from(newSelection));
  }

  selectChildren() {
    const {dags, nodeSelection, currentTime} = this.state;
    const currentDag = dags[dags.length - 1];
    const nodesInActiveDag = currentDag.computeNodesInActiveDag(currentTime);

    const newSelection = new Set(nodeSelection);
    for (const nodeId of nodeSelection) {
      assert(nodesInActiveDag.has(nodeId));
      for (const childId of currentDag.getChildren(nodeId)) {
        if(nodesInActiveDag.has(childId)) {
          newSelection.add(childId);
        }
      }
    }
    this.updateNodeSelection(Array.from(newSelection));
  }

  selectCommonConsequences() {
    const {dags, nodeSelection, currentTime} = this.state;
    const currentDag = dags[dags.length - 1];
    const nodesInActiveDag = currentDag.computeNodesInActiveDag(currentTime);

    const commonConsequences = findCommonConsequences(currentDag, new Set(nodeSelection));
    const newSelection = new Array<number>();
    for (const nodeId of commonConsequences) {
      if (nodesInActiveDag.has(nodeId)) {
        newSelection.push(nodeId);
      }
    }
    this.updateNodeSelection(newSelection);
  }

  // LITERALS ////////////////////////////////////////////////////////////////////////////////////////////////////////

  private changeLiteralOrientation(nodeId: number, oldPosition: ["premise" | "conclusion" | "context", number], newPosition: ["premise" | "conclusion" | "context", number]) {
    const dags = this.state.dags;
    assert(dags.length > 0);
    const dag = dags[0];
    const currentDag = dags[dags.length - 1];
    const node = dag.nodes.get(nodeId);
    assert(node !== undefined);
    assert(node!.unit.type === "Clause");
    const clause = node!.unit as Clause;

    clause.changeLiteralOrientation(oldPosition, newPosition);

    const changedNodes = computeClauseRepresentation(dag, nodeId);
    
    this.setState({changedNodesEvent: changedNodes});
  }

  private changeLiteralRepresentation(nodeId: number, literal: Literal) {
    const dags = this.state.dags;
    assert(dags.length > 0);
    const dag = dags[0];
    const node = dag.nodes.get(nodeId);
    assert(node !== undefined);

    literal.switchToNextRepresentation();
    
    const changedNodes = computeClauseRepresentation(dag, nodeId);

    this.setState({changedNodesEvent: changedNodes});
  }

  // HELPERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  updateNodePositions(nodeIds: Array<number>, delta: [number, number]) {
    const dags = this.state.dags
    assert(this.state.dags.length > 0);
    const dag = dags[dags.length - 1];
    for (const nodeId of nodeIds) {
      const node = dag.get(nodeId);
      assert(node.position !== null);
      node.position = [node.position![0] + delta[0], node.position![1] + delta[1]];
    }
  }

  // push a new dag on the stack of dags
  // Precondition: the layout for newDag has already been computed
  private pushDag(newDag: Dag) {
    assert(!newDag.isPassiveDag);

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
      nodeSelection: selectedNodesInNewDag,
      animateDagChanges: false
    });
  }

  private popDag() {
    assert(this.state.dags.length > 1, "Undo last step must only be called if there exist at least two dags");

    this.setState((state, props) => ({
      dags: state.dags.slice(0, state.dags.length-1),
      animateDagChanges: false
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

  // STATE TOGGLE //////////////////////////////////////////////////////////////////////////////////////////////////////

  toggleInfo() {
    this.setState({ infoToggle: !this.state.infoToggle });
  }

  toggleEdit() {
    this.setState({ editToggle: !this.state.editToggle });
  }
}

export default App;
