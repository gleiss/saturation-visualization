import SatNode from './sat-node';
import { assert } from './util';
import { UnitParser } from './unit-parser';
import { ReversePostOrderTraversal, DFPostOrderTraversal } from "./traversal";
import { Clause } from './unit';

export class ParsedLine {
  readonly type: "preprocessing" | "new" | "active" | "forward reduce" | "backward reduce" | "replaced by" | "using";
  readonly id: number;
  readonly unitString: string;
  readonly inferenceRule: string;
  parents: Array<number>;
  readonly statistics: Map<any, any>; 

  constructor(type: "preprocessing" | "new" | "active" | "forward reduce" | "backward reduce" | "replaced by" | "using", id: number, unitString: string, inferenceRule: string, parents: Array<number>, statistics: Map<any, any>) {
    this.type = type;
    this.id = id;
    this.unitString = unitString;
    this.inferenceRule = inferenceRule;
    this.parents = parents;
    this.statistics = statistics;
  }
}

export class Dag {

  // TODO: it seems that the result of Graphviz depends on the order of node- and edge declarations.
  //       the order of these declarations depends on the order in which the nodes occur in the nodes-Map.
  //       therefore it could make sense to normalize the order of nodes in the nodes-Map at construction time of the Dag.
  readonly nodes: Map<number,SatNode>;
  readonly leaves: Set<number>;
  readonly mergeMap: Map<number, Array<number>> | null;
  
  // invar: if isPassiveDag, then styleMap !== null
  readonly isPassiveDag: boolean;
  readonly styleMap: Map<number, "passive" | "deleted" | "boundary"> | null;
  readonly activeNodeId: number | null; // the id of the node for which passiveDag was computed

  constructor(nodes: Map<number,SatNode>, mergeMap: Map<number, Array<number>> | null = null, isPassiveDag: boolean = false, styleMap: Map<number, "passive" | "deleted" | "boundary"> | null = null, activeNodeId: number | null = null) {
    this.nodes = nodes;
    this.mergeMap = mergeMap;

    assert(!isPassiveDag || styleMap !== null);
    assert(!isPassiveDag || activeNodeId !== null);
    assert(!isPassiveDag || nodes.has(activeNodeId as number));

    this.isPassiveDag = isPassiveDag;
    this.styleMap = styleMap;
    this.activeNodeId = activeNodeId;

    // sanity check: key and id of node need to match
    for (const [nodeId, node] of nodes) {
      assert(nodeId === node.id, `key ${nodeId} and id ${node.id} of node ${node} don't match!`);
    }

    // sanity check: each parentId needs to occur in the derivation as node
    for (const [nodeId, node] of nodes) {
      for (const parentId of node.parents) {
        assert(nodes.has(parentId), `node ${nodeId} has parent ${parentId} which does not occur as node in the dag!`);
      }
    }
    // compute leaves
    const leaves: Set<number> = new Set();
    const nonLeaves: Set<number> = new Set();
    
    for (const node of nodes.values()) {
      for (const parentId of node.parents) {
        nonLeaves.add(parentId);
      }
    }

    for (const nodeId of nodes.keys()) {
      if(!nonLeaves.has(nodeId)) {
        leaves.add(nodeId);
      }
    }

    this.leaves = leaves;
  }

  get(nodeId: number): SatNode {
    const node = this.nodes.get(nodeId);
    assert(node !== undefined, "node doesn't occur in Dag");
    return node as SatNode;
  }

  maximalActiveTime(): number {
    let max = 0;
    for (const node of this.nodes.values()) {
      if (node.activeTime !== null && node.activeTime > max) {
        max = node.activeTime;
      }
    }
    return max;
  }

  isEmpty(): boolean {
    return this.nodes.size === 0;
  }

  getChildren(nodeId: number): Array<number> {
    if(!this.nodes.has(nodeId)) {
      assert(false, "Node with id " + nodeId + " does not occur in Dag");
    }

    const children = new Array<number>();
    for (const node of this.nodes.values()) {
      for (const parentId of node.parents) {
        if (parentId === nodeId) {
          children.push(node.id);
        }
      }
    }
    return children;
  }

  numberOfTransitiveActivatedChildren(nodeId: number, currentTime: number) {
    let counter = 0;

        // use new set to avoid mutating relevantIds
    const transitiveChildrenIds = new Set<number>([nodeId]);

    // add all transitive children of ids in transitiveChildren to transitiveChildren
    const iterator = new DFPostOrderTraversal(this);
    while (iterator.hasNext()) {
      let currentNode = iterator.getNext();

      // check if currentNode occurs in transitiveChildren or
      // has a parent which occurs in transitiveChildren
      let existsRelevantParent = false;
      for (const parentId of currentNode.parents) {
        if (transitiveChildrenIds.has(parentId)) {
          existsRelevantParent = true;
          break;
        }
      }
      const isRelevant = existsRelevantParent || transitiveChildrenIds.has(currentNode.id);
      const alreadyGenerated = currentNode.isFromPreprocessing || (currentNode.newTime !== null && currentNode.newTime <= currentTime);
      if (isRelevant && alreadyGenerated) {
        // add its id to the set of relevant ids
        transitiveChildrenIds.add(currentNode.id);

        const alreadyActivated = currentNode.activeTime !== null && currentNode.activeTime <= currentTime;
        if (currentNode.id !== nodeId && alreadyActivated) {
          counter = counter + 1;
        }
      }
    }

    return counter;
  }

  /* we can partition all nodes of the derivation into three sets
   * 1) inputNodes: the nodes given to Vampire's preprocessing as input
   * 2) preprocessingResultNodes: the nodes remaining at the end of Vampire's preprocessing, (which are then used as input for saturation)
   * 3) otherNodes: the nodes generated by saturation
   *
   * this function decides for a given node whether it should be treated as input node, using the following idea:
   * 1) input nodes occur before saturation is started and are therefore tagged with "isFromPreprocessing"
   * 2) preprocessingResultNodes are used as input for saturation, so their newTime is set
   */ 
  nodeIsInputNode(nodeId: number): boolean {
    const node = this.get(nodeId);

    if (!node.isFromPreprocessing) {
      return false;
    }
    if(node.newTime !== null) {
      return false;
    }
    return true;
  }

  // heuristics to determine whether a node is a theory axiom
  // note: Vampire uses "theory axiom" for some of the internal theory axioms
  // the internal theory axioms added for term algebras do not follow this convention
  // even more, one of those term algebra axioms (the exhaustiveness axiom) is added as formula (in contrast to all other axioms which are added as clauses)
  // in particular, the exhaustiveness axiom consists of a formula labelled "term algebras exhaustiveness" and a child node which is labelled cnf transformation
  nodeIsTheoryAxiom(nodeId: number): boolean {
    const node = this.get(nodeId);
    assert(node !== undefined, "node doesn't occur in Dag");

    if (!node.isFromPreprocessing) {
      return false;
    }
    if (node.inferenceRule === "theory axiom" || 
        node.inferenceRule === "term algebras injectivity" || 
        node.inferenceRule === "term algebras distinctness" ||
        node.inferenceRule === "term algebras exhaustiveness" ||
        (node.parents.length === 1 && this.get(node.parents[0]).inferenceRule ===  "term algebras exhaustiveness")) {
      return true;
    }

    return false;
  }

  // either 1) create a new dag given an array of parsed lines and no existing dag,
  // or     2) extend an existing dag with an array of parsed lines
  // In case 2) we assume that all the parsedLines are generated during Saturation, i.e. no additional preprocessing occurs.
  static fromParsedLines(parsedLines: Array<ParsedLine>, existingDag: Dag | null): Dag {
    const nodes = (existingDag === null) ? new Map<number, SatNode>() : new Map<number, SatNode>(existingDag.nodes);

    let currentNode: SatNode | null = null;
    let currentTime = (existingDag === null) ? 0 : existingDag.maximalActiveTime();

    let emptyClauseNode: SatNode | null = null;

    for (const line of parsedLines) {

      // some preprocessing nodes have potentially been merged, and there could be parsedLines which still reference the ids of these nodes.
      // we therefore convert those ids using the merge-map
      if (existingDag !== null && existingDag.mergeMap !== null) {
        assert(existingDag.mergeMap.get(line.id) === undefined, `found line with id ${line.id} of node deleted during merge of preprocessing nodes!`);
        const parentsAfterMerge = new Array<number>();
        for (const parentId of line.parents) {
          const mergedParentsOrUndefined = existingDag.mergeMap.get(parentId);
          if (mergedParentsOrUndefined !== undefined) {
            parentsAfterMerge.push(...mergedParentsOrUndefined);
          } else {
            parentsAfterMerge.push(parentId);
          }
        }
        line.parents = parentsAfterMerge;
      }

      if (line.type === "preprocessing") {
        // line represents the generation of a clause during preprocessing
        assert(existingDag === null, "no new preprocessing lines should occur while extending existing dag with new nodes from saturation")
        assert(!nodes.has(line.id), "each clause must be generated by preprocessing only once");
        const unit = UnitParser.parsePreprocessingUnit(line.unitString);

        // hack: Vampire treats a conjecture as input clause, followed by an inference, which transforms the input into a negated conjecture.
        // we want only the negated conjecture, so we delete the (single) premise of such an inference if it occurs.
        if (line.inferenceRule === "negated conjecture") {
          assert(line.parents.length === 1);
          // remove parent from nodes
          const parent = nodes.get(line.parents[0]);
          assert(parent !== undefined);
          assert((parent as SatNode).inferenceRule === "input");
          const success = nodes.delete(line.parents[0]);
          assert(success);
          // update parents of current line
          line.parents = [];
        }

        currentNode = new SatNode(line.id, unit, line.inferenceRule, line.parents, line.statistics, true, null, null, null, []);
        nodes.set(currentNode.id, currentNode);
      }
      else if (line.type === "new") {
        if (!nodes.has(line.id)) {
          // line represents the generation of a new clause (which wasn't generated in preprocessing) during saturation
          
          // create new node
          const unit = UnitParser.parseClause(line.unitString);
          currentNode = new SatNode(line.id, unit, line.inferenceRule, line.parents, line.statistics, false, currentTime, null, null, []);
          nodes.set(currentNode.id, currentNode);

          if(line.unitString === "$false") {
            emptyClauseNode = currentNode;
          }
        } else {
          // line represents a final clause from preprocessing, which now is added into saturation
          assert(existingDag === null, "no new final clauses from preprocessing should occur during the extension of an existing dag")
          currentNode = nodes.get(line.id) as SatNode;
          assert(currentNode.isFromPreprocessing, "a newly added clause can only already exist if it was generated during preprocessing");
          assert(line.inferenceRule === currentNode.inferenceRule, "inference rule differs between line and existing node");
          currentNode.unit = UnitParser.parseClause(line.unitString);
          currentNode.newTime = currentTime;
        }
      }
      else if (line.type === "active") {
        // line represents the addition of that clause to active
        // an active-event gives us the following information about a clause:
        // - the node was activated at the current time.
        // - the number of selected literals in the clause, saved in the statistics-object ("nSel") of the active-event
        // - the literals in the clause which are selected: the clause of the active-event satisfies the invariant that the selected literals occur first.
        // - some statistics about the clause and its derivation, saved in the statistics-object of the active-event
        assert(nodes.has(line.id), `Found clause with id ${line.id}, which was added to active, but wasn't added to new before. Maybe you forgot to output the new clauses?`);
        currentNode = nodes.get(line.id) as SatNode;
        assert(line.id === currentNode.id, "id differs between line and existing node");
        assert(line.inferenceRule === currentNode.inferenceRule, "inference rule differs between line and existing node");
        assert(line.parents.length === currentNode.parents.length, "number of parents differs between line and existing node");
        for (let i = 0; i < line.parents.length; i++) {
          assert(line.parents[i] === currentNode.parents[i], `line and node differ on parent ${i}, which is ${line.parents[i]} resp. ${currentNode.parents[i]}.`);
        }
        assert(currentNode.newTime !== null, "for each event [SA] active ... there has to be an earlier event of the form [SA] new ... with the same clause!")
        assert(currentNode.activeTime === null, "there must only be 1 event of the form [SA] active ... for each clause");
        assert(currentNode.unit.type === "Clause");
        const clause = currentNode.unit as Clause;

        // note that the literals in clauseAfterActivation potentially occur in a different order than in clause,
        // since clauseAfterActivation satisfies the invariant that the selected literals occur first.
        const clauseAfterActivation = UnitParser.parseClause(line.unitString);
        assert(clauseAfterActivation.premiseLiterals.length === 0);

        const nSel = line.statistics.get("nSel");
        assert(nSel !== undefined && nSel !== null);

        // match each selected literal with a literal in the existing clause and mark that literal as selected.
        for (let i = 0; i < nSel && i < clauseAfterActivation.conclusionLiterals.length; i++) {
          const selectedLiteralString = clauseAfterActivation.conclusionLiterals[i].toString(true);
          let foundMatch = false;
          for (const existingLiteral of clause.premiseLiterals) {
            if (existingLiteral.toString(true) === selectedLiteralString) {
              existingLiteral.isSelected = true;
              foundMatch = true;
              break;
            }
          }
          if (foundMatch) {
            continue;
          }
          for (const existingLiteral of clause.conclusionLiterals) {
            if (existingLiteral.toString(true) === selectedLiteralString) {
              existingLiteral.isSelected = true;
              foundMatch = true;
              break;
            }
          }
          assert(foundMatch);
        }

        currentTime = currentTime + 1;
        currentNode.activeTime = currentTime;
        currentNode.statistics = line.statistics
      }
      else if (line.type === "forward reduce" || line.type === "backward reduce") {
        // line represents the removal of a clause from saturation
        assert(nodes.has(line.id), `Found clause with id ${line.id}, which was deleted, but wasn't added as new before. Maybe you forgot to output the new clauses?`);
        currentNode = nodes.get(line.id) as SatNode;
        currentNode.deletionTime = currentTime;
      }
      else if (line.type === "replaced by" || line.type === "using") {
        // line represents one of the clauses which allowed to remove the clause represented by currentNode from saturation
        assert(currentNode !== null, "invar");
        (currentNode as SatNode).deletionParents.push(line.id);
      }
      else {
        assert(false, `invalid line: ${line.unitString}`);
      }
    }

    // hack: pretend that empty clause was added to passive and then activated
    // note that this can only be done after all lines are parsed, since a new-event with the empty clause often triggers a deletion-event
    if (emptyClauseNode !== null) {
      currentTime = currentTime + 1;
      emptyClauseNode.activeTime = currentTime;
      nodes.set(emptyClauseNode.id, emptyClauseNode);
    }

    const extendedDag = new Dag(nodes, existingDag === null ? null : existingDag.mergeMap);

    return extendedDag;
  }

  // note: includes nodes which have been activated, but have also been deleted
  computeActiveNodes(currentTime: number) : Set<number> {
    const activeNodeIds = new Set<number>();
    for (const [nodeId, node] of this.nodes) {
      const nodeIsActive = (node.activeTime !== null && node.activeTime <= currentTime);
      if (nodeIsActive) {
        activeNodeIds.add(nodeId);
      }
    }

    return activeNodeIds;
  }

  // Definition: the active dag contains all nodes which occur in the derivation of a currently active node, and all preprocessing nodes
  computeNodesInActiveDag(currentTime: number) : Set<number> {
    const nodeIds = this.computeActiveNodes(currentTime);

	  // add all transitive parents of nodeIds to nodeIds
	  const iterator = new ReversePostOrderTraversal(this);
	  while (iterator.hasNext()) {
		  const currentNode = iterator.getNext();
      const currentNodeId = currentNode.id;
    
      if (nodeIds.has(currentNodeId)) {
        for (const parentId of currentNode.parents) {
          nodeIds.add(parentId);
        }
      }    
    }

    // add all preprocessing nodes
    for (const node of this.nodes.values()) {
      if (node.isFromPreprocessing) {
        nodeIds.add(node.id);
      }
    }
    
    return nodeIds;
  }

  isRefutation(): boolean {
    for (const node of this.nodes.values()) {
      if(node.unit.type == "Clause" && 
          (node.unit as Clause).premiseLiterals.length == 0 && 
          (node.unit as Clause).conclusionLiterals.length == 0) {
            return true;
          }
    }
    return false;
  }
}