import { assert } from './util'
import { Unit } from './unit'
import { UnitParser } from './unit-parser';

export default class SatNode {

  readonly id: number;
  readonly unit: Unit;
  readonly inferenceRule: string;
  readonly parents: number[];
  readonly statistics: Map<string,number>;
  readonly isFromPreprocessing: boolean;
  readonly newTime: number;
  readonly passiveTime: number;
  readonly activeTime: number;
  readonly deletionTime: number;
  readonly deletionParents: number[];

  constructor(
    id: number,
    unit: Unit,
    inferenceRule: string,
    parents: number[],
    statistics: Map<string,number>,
    isFromPreprocessing: boolean,
    newTime: number,
    passiveTime: number,
    activeTime: number,
    deletionTime: number,
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