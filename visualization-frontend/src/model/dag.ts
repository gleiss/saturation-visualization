import SatNode from './sat-node';
import { assert } from './util';

export default class Dag {

  // TODO: it seems that the result of Graphviz depends on the order of node- and edge declarations.
  //       the order of these declarations depends on the order in which the nodes occur in the nodes-Map.
  //       therefore it could make sense to normalize the order of nodes in the nodes-Map at construction time of the Dag.
  readonly nodes: Map<number,SatNode>;
  readonly leaves: Set<number>;

  constructor(nodes: Map<number,SatNode>) {
    this.nodes = nodes;

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
    assert(this.nodes.has(nodeId), "node doesn't occur in Dag");
    return this.nodes.get(nodeId) as SatNode;
  }

  numberOfHistorySteps(): number {
    let counter = 0;
    for (const node of this.nodes.values()) {
      if (node.activeTime !== null) {
        counter += 1;
      }
    }
    return counter;
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

  nodeIsInputNode(nodeId: number): boolean {
    assert(this.nodes.has(nodeId), "node doesn't occur in Dag");
    const node = this.get(nodeId);

    // TODO: maybe not accurate if node has no children.
    if (node.isFromPreprocessing) {
      const childrenIds = this.getChildren(nodeId);
      for (const childId of childrenIds) {
        const childNode = this.get(childId);
        if (childNode.isFromPreprocessing) {
          return true;
        }
      }
    }
    return false;
  }
  static fromSetOfNodes(nodes: Set<SatNode>): Dag {
    const nodeDict = new Map<number,SatNode>();
    for (const node of nodes) {
      nodeDict.set(node.id,node);
    }
    return new Dag(nodeDict);
  }

  static fromDto(dto: any): Dag {
    const nodeDict = new Map<number,SatNode>();

    Object.values(dto.nodes).forEach((node: any) => nodeDict.set(node.number, SatNode.fromDto(node)));
    return new Dag(nodeDict);
  }

}
