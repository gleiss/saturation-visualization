import { assert } from './util'
import { Unit } from './unit'
import { UnitParser } from './unit-parser';

export default class SatNode {

  readonly id: number;
  unit: Unit;
  readonly inferenceRule: string;
  readonly parents: number[];
  statistics: Map<string,number>;
  readonly isFromPreprocessing: boolean;
  newTime: number | null;
  activeTime: number | null;
  deletionTime: number | null;
  deletionParents: number[];
  position: [number,number] | null;

  constructor(
    id: number,
    unit: Unit,
    inferenceRule: string,
    parents: number[],
    statistics: Map<string,number>,
    isFromPreprocessing: boolean,
    newTime: number | null,
    activeTime: number | null,
    deletionTime: number | null,
    deletionParents: number[]
  ) {
    this.id = id;
    this.unit = unit;
    this.inferenceRule = inferenceRule;
    this.parents = parents;
    this.statistics = statistics;
    this.isFromPreprocessing = isFromPreprocessing;
    this.newTime = newTime;
    this.activeTime = activeTime;
    this.deletionTime = deletionTime;
    this.deletionParents = deletionParents;
    this.position = null;
  }

  // return a copy of this node, where the position is null
  copy(): SatNode {
    return new SatNode(this.id, this.unit, this.inferenceRule, this.parents, this.statistics, this.isFromPreprocessing, this.newTime, this.activeTime, this.deletionTime, this.deletionParents);
  }

  getPosition(): [number,number] {
    assert(this.position !== null, `accessing position of node with id ${this.id}, which has not been computed`);
    return this.position as [number,number];
  }

  toString(): string {
    return this.unit.toString();
  }

  toHTMLString(currentTime: number): string {
    const isActive = this.activeTime !== null && this.activeTime <= currentTime;
    return this.unit.toHTMLString(isActive);
  }
}