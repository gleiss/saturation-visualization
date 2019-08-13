import SatNode from './sat-node';
import { assert } from './util';

export default class Dag {

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
