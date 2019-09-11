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
  passiveTime: number | null;
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
    passiveTime: number | null,
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
    this.passiveTime = passiveTime;
    this.activeTime = activeTime;
    this.deletionTime = deletionTime;
    this.deletionParents = deletionParents;
    this.position = null;
  }

  // return a copy of this node, where the position is null
  copy(): SatNode {
    return new SatNode(this.id, this.unit, this.inferenceRule, this.parents, this.statistics, this.isFromPreprocessing, this.newTime, this.passiveTime, this.activeTime, this.deletionTime, this.deletionParents);
  }

  getPosition(): [number,number] {
    assert(this.position !== null, `accessing position of node with id ${this.id}, which has not been computed`);
    return this.position as [number,number];
  }

  toString(): string {
    return this.unit.toString();
  }

  toHTMLString(): string {
    return this.unit.toHTMLString();
  }

  static fromDto(dto: any): SatNode {
    assert(typeof dto.number === 'number', "dto.number has to be a number");

    assert(dto.new_time !== undefined, "new_time must be a number or null");
    assert(dto.passive_time !== undefined, "passive_time must be a number or null");
    assert(dto.active_time !== undefined, "active_time must be a number or null");
    assert(dto.deletion_time !== undefined, "deletion_time must be a number or null");
    assert((dto.deletion_time === null && dto.deletion_parents === null) || (dto.deletion_time !== null && dto.deletion_parents !== null), "invariant violated")

    const statistics = new Map<string,number>();
    for (const key in dto.statistics) {
      const val = dto.statistics[key];
      if (typeof val === "number"){
        statistics.set(key, val);
      }
    }
    const unit = UnitParser.parseUnit(dto.clause, dto.is_from_preprocessing, statistics);
    return new SatNode(
      dto.number,
      unit,
      dto.inference_rule,
      dto.parents,
      statistics,
      dto.is_from_preprocessing,
      dto.new_time,
      dto.passive_time,
      dto.active_time,
      dto.deletion_time,
      dto.deletion_parents
    );
  }
}