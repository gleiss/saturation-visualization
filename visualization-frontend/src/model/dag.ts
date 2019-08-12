import SatNode from './sat-node';

export default class Dag {

  readonly nodes: { [key: number]: SatNode };

  constructor(nodes: { [key: number]: SatNode }) {
    this.nodes = nodes;
  }

  get(nodeId: number): SatNode {
    return this.nodes[nodeId];
  }

  numberOfHistorySteps(): number {
    let counter = 0;
    Object.values(this.nodes)
      .forEach(node => {
        if (node.activeTime !== null) {
          counter += 1;
        }
      });
    return counter;
  }

  hasNodes(): boolean {
    return Object.keys(this.nodes).length > 0;
  }

  static fromSetOfNodes(nodes: Set<SatNode>): Dag {
    const nodeDict: { [key: number]: SatNode } = {};
    nodes.forEach(node => nodeDict[node.id] = node);
    return new Dag(nodeDict);
  }

  static fromDto(dto: any): Dag {
    const nodes: { [key: number]: SatNode } = {};
    Object.values(dto.nodes).forEach((node: any) => nodes[node.number] = SatNode.fromDto(node));
    return new Dag(nodes);
  }

}
