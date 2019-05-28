import {assert} from './util';

export class Node {

	constructor(number, clause, inferenceRule, parents, statistics, isFromPreprocessing) {
		this.checkAssertions(number, clause, inferenceRule, parents, statistics, isFromPreprocessing);

		this.number = number;
        this.clause = clause; // TODO: remove quotes
        this.inferenceRule = inferenceRule;
        this.parents = parents;
        this.statistics = statistics;
        this.isFromPreprocessing = isFromPreprocessing;
        this.newTime = undefined;
        this.passiveTime = undefined;
		this.activeTime = undefined;
	}

	setNewTime(time) {
		assert(typeof time === "number");
		assert(this.newTime === undefined);
		assert(this.passiveTime === undefined);
		assert(this.activeTime === undefined);
		this.newTime = time;
	}

	setPassiveTime(time) {
		assert(typeof time === "number");
		assert(this.newTime !== undefined);
		assert(this.passiveTime === undefined);
		assert(this.activeTime === undefined);
		this.passiveTime = time;
	}

	setActiveTime(time) {
		assert(typeof time === "number");
		assert(this.newTime !== undefined);
		assert(this.passiveTime !== undefined);
		assert(this.activeTime === undefined);
		this.activeTime = time;
	}

	checkAssertions(number, clause, inferenceRule, parents, statistics, isFromPreprocessing) {
		// cf. discussion https://stackoverflow.com/questions/899574/what-is-the-difference-between-typeof-and-instanceof-and-when-should-one-be-used\  
		assert(typeof number === "number");
        assert(typeof clause === "string");
		assert(typeof inferenceRule === "string");
		assert(typeof isFromPreprocessing === "boolean");
		assert(Array.isArray(parents));
		assert(Array.isArray(statistics));
		parents.forEach(parent => {
			assert(typeof parent === "number");
		});
		statistics.forEach(stat => {
			assert(typeof stat === "number");
		});
	}

	toString() {
		return this.clause;
	}
}