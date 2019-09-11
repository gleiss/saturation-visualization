import { assert } from '../model/util';
import { Dag } from '../model/dag';
import { runViz } from './callViz';
import SatNode from './sat-node';

const PLAIN_PATTERN = /^(\d+) ([0-9.]+) ([0-9.]+).*$/g;

export class VizWrapper {

  static async layoutDag(dag: Dag, onlyActiveDag: boolean) {
    // generate dot string
    const dotString = VizWrapper.dagToDotString(dag, onlyActiveDag);
    
    // use viz to compute layout for dag given as dotstring
    // note that viz returns the layout as a string
    const layoutString = await runViz(dotString);

    // parse the layout string into array of network-nodes
    VizWrapper.parseLayoutString(layoutString, dag.nodes);
  };

  static async layoutNodes(nodes: Map<number, SatNode>) {
    // generate dot string
    const dotString = VizWrapper.nodesToDotString(nodes);

    // use viz to compute layout for nodes given as dotstring
    // note that viz returns the layout as a string
    const layoutString = await runViz(dotString);

    // parse the layout string into array of network-nodes
    VizWrapper.parseLayoutString(layoutString, nodes);
  }

  // encodes layout-problem into dot-language
  // the solution to the layout-problem contains a position for each node, which either
  // - is a preprocessing node
  // - occurs in the derivation of at least one activated clause
  static dagToDotString(dag: Dag, onlyActiveDag: boolean): string {
    const nodesInActiveDag = onlyActiveDag ? dag.computeNodesInActiveDag(Number.MAX_SAFE_INTEGER) : null;

    const inputStrings = new Array<string>();
    const preprocessingStrings = new Array<string>();
    const otherStrings = new Array<string>();    
    for (const node of dag.nodes.values()) {
      assert(node.position === null, "the dag has already been layouted!");
      if (node.isFromPreprocessing) {
        if(dag.nodeIsInputNode(node.id)) {
          inputStrings.push(`${node.id} [label="${node.toString()}"]`);
        } else {
          preprocessingStrings.push(`${node.id} [label="${node.toString()}"]`);
        }
      } else  {
        if (!onlyActiveDag || (nodesInActiveDag as Set<number>).has(node.id)) {
          otherStrings.push(`${node.id} [label="${node.toString()}"]`);
        }
      }
    }

    const edgeStrings = new Array<string>();
    for (const node of dag.nodes.values()) {
      if (node.isFromPreprocessing || !onlyActiveDag || (nodesInActiveDag as Set<number>).has(node.id)) {
        for (const parentId of node.parents) {
          edgeStrings.push(`${parentId} -> ${node.id}`)
        }
      }
    }

    const inputString = "   subgraph inputgraph {\n      rank=source;\n      " + inputStrings.join(";\n      ") + "\n   }";
    const preprocessingString = "   subgraph preprocessinggraph {\n      rank=same;\n      " + preprocessingStrings.join(";\n      ") + "\n   }";
    const otherstring = "   subgraph othergraph {\n      " + otherStrings.join(";\n      ") + "\n   }";
    const edgeString = edgeStrings.join(";\n   ");

    const dotString =  "digraph {\n\n" + inputString + "\n\n" + preprocessingString + "\n\n" + otherstring + "\n\n   " + edgeString + "\n}";
    
    return dotString;
  };

  static nodesToDotString(nodes: Map<number, SatNode>): string {
    const nodeStrings = new Array<string>();
    for (const node of nodes.values()) {
      assert(node.position === null, "the node has already been layouted!");
      nodeStrings.push(`${node.id} [label="${node.toString()}"]`);
    }

    const edgeStrings = new Array<string>();
    for (const node of nodes.values()) {
      for (const parentId of node.parents) {
        if (nodes.has(parentId)) {
          edgeStrings.push(`${parentId} -> ${node.id}`)
        }
      }
    }

    const dotString =  "digraph {\n   " + nodeStrings.join(";\n   ") + "\n\n   " + edgeStrings.join(";\n   ") + "\n}";
    return dotString;
  };

  static parseLayoutString(layoutString: string, nodes: Map<number, SatNode>) {
    let firstEdgeLineIndex = layoutString.includes('\nedge') ? layoutString.indexOf('\nedge') : layoutString.length;
    // split layoutString to array of strings describing positions of nodes
    const parsedNodeLines = layoutString
      .substr(0, firstEdgeLineIndex) // ignore remaining part of string describing edges
      .split('\nnode ') //split lines
      .slice(1) // ignore first line describing graph
      .map(line => line.substr(0, line.indexOf('"'))) // ignore remaining part of line causing problems with line breaks
      .map((line) => line.matchAll(PLAIN_PATTERN).next().value); // parse each remaining line
    parsedNodeLines.forEach(line => {
      assert(line !== undefined); // check that each remaining line was successfully parsed
	  });
	
    // update SatNode for each nodeString
    for (const parsedNodeLine of parsedNodeLines) {
      const [, idString, xString, yString] = parsedNodeLine;
      const id = parseInt(idString, 10);
      const x = parseFloat(xString);
      const y = parseFloat(yString);
      const node = nodes.get(id) as SatNode;
      node.position = [x,y];
    }
  }
}