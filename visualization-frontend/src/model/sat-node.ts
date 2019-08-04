export default class SatNode {
  id: number;
  clause: string;
  inferenceRule: string;
  parents: number[];
  statistics: any[];
  isFromPreprocessing: boolean;
  newTime: number;
  passiveTime: number;
  activeTime: number;

  constructor(
    id: number,
    clause: string,
    inferenceRule: string,
    parents: number[],
    statistics: any[],
    isFromPreprocessing: boolean,
    newTime: number,
    passiveTime: number,
    activeTime: number
  ) {
    this.id = id;
    this.clause = clause;
    this.inferenceRule = inferenceRule;
    this.parents = parents;
    this.statistics = statistics;
    this.isFromPreprocessing = isFromPreprocessing;
    this.newTime = newTime;
    this.passiveTime = passiveTime;
    this.activeTime = activeTime;
  }

  toString(): string {
    return this.clause;
  }

  static fromDto(dto: any): SatNode {
    return new SatNode(
      dto.number,
      dto.clause,
      dto.inference_rule,
      dto.parents,
      dto.statistics,
      dto.is_from_preprocessing,
      dto.new_time,
      dto.passive_time,
      dto.active_time
    );
  }

}
