import {assert} from './util'
import {Unit, Formula, Clause} from './unit'
import {Literal, Term} from './literal'
import { Dag, SatNodeStyle } from './dag'
import SatNode from './sat-node';
import { computeParentLiterals } from './clause-orientation';

export class DagSerializer {
	static serializeDag(dag: Dag): string {
		assert(!dag.isPassiveDag);

		const replacer = (key, value) => {
			// ignore several properties
			if (key === "leaves" ||
				key === "mergeMap" ||
				key === "isPassiveDag" ||
				key === "styleMap" ||
				key === "activeNodeId" ||
				key === "literalInParent" ||
				key === "isVariable") {
				
				return undefined; 
			}
			// encode premise-, conclusion-, and context-literals of Clauses
			if (key == "unit") {
				const unit = (value as Unit);
				if (unit.type === "Clause") {
					const clause = (value as Clause);

					const convertToIndices = (literals) => {
						const encodedLiterals = new Array<number>();
						for (const lit1 of literals) {
							for (let i = 0; i < clause.literalsNewEvent.length; i++) {
								const lit2 = clause.literalsNewEvent[i];
								if (lit1 === lit2) {
									encodedLiterals.push(i);
									break;
								}
							}
						}
						return encodedLiterals;
					}
					const encodedPremiseLiterals = convertToIndices(clause.premiseLiterals);
					const encodedConclusionLiterals = convertToIndices(clause.conclusionLiterals);
					const encodedContextLiterals = convertToIndices(clause.contextLiterals);
					const encodedLiteralsActiveEvent = clause.literalsActiveEvent === null ? null : convertToIndices(clause.literalsActiveEvent);

					return {
						"type": "Clause", 
						"literalsNewEvent": clause.literalsNewEvent, 
						"premiseLiterals": encodedPremiseLiterals, 
						"conclusionLiterals": encodedConclusionLiterals, 
						"contextLiterals": encodedContextLiterals,
						"literalsActiveEvent": encodedLiteralsActiveEvent
					};
				}
			}

			// convert sets and maps to arrays
			if (value instanceof Set) {
				return Array.from(value);
			} else if (value instanceof Map) {
				return Array.from(value.entries());
			}
			return value;
		};

		console.log(JSON.stringify(dag, replacer, 3));
		return JSON.stringify(dag, replacer);
	}

	static deserializeDag(json: string): Dag {
		const res = JSON.parse(json);
		return DagSerializer.reconstructDag(res);
	}

	static reconstructDag(obj): Dag {
		assert(obj.nodes !== undefined);
		const nodes = new Map<number,SatNode>();
		for (const pairIdNode of obj.nodes) {
			nodes.set(pairIdNode[0], DagSerializer.reconstructSatNode(pairIdNode[1]));
		}
		const dag = new Dag(nodes);
		computeParentLiterals(dag); // TODO: hack.

		return dag;
	}
	

	static reconstructSatNode(obj): SatNode {
		assert(obj.id !== undefined);
		assert(obj.unit !== undefined);
		assert(obj.inferenceRule !== undefined);
		assert(obj.parents !== undefined);
		assert(obj.statistics !== undefined);
		assert(obj.isFromPreprocessing !== undefined);
		assert(obj.newTime !== undefined);
		assert(obj.activeTime !== undefined);
		assert(obj.deletionTime !== undefined);
		assert(obj.deletionParents !== undefined);
		assert(obj.position !== undefined);
		assert(obj.isBoundary !== undefined);

		const unit = DagSerializer.reconstructUnit(obj.unit);
		const statistics = new Map<string,number>();
		for (const pair of obj.statistics) {
			statistics.set(pair[0], pair[1]);
		}

		const node = new SatNode(obj.id, unit, obj.inferenceRule, obj.parents, statistics, obj.isFromPreprocessing, obj.newTime, obj.activeTime, obj.deletionTime, obj.deletionParents, obj.isBoundary);
		node.position = obj.position;

		return node;
	}

	static reconstructUnit(obj): Unit {
		assert(obj.type !== undefined);
		if (obj.type === "Formula") {
			assert(obj.formula !== undefined);
			return new Formula(obj.formula);
		} else {
			assert(obj.literalsNewEvent !== undefined);
			assert(obj.premiseLiterals !== undefined);
			assert(obj.conclusionLiterals !== undefined);
			assert(obj.contextLiterals !== undefined);
			assert(obj.literalsActiveEvent !== undefined);
			
			const literalsNewEvent = obj.literalsNewEvent.map(literal => DagSerializer.reconstructLiteral(literal));
			
			// reconstruct encoded literal-arrays
			const premiseLiterals = obj.premiseLiterals.map(n => literalsNewEvent[n]);
			const conclusionLiterals = obj.conclusionLiterals.map(n => literalsNewEvent[n]);
			const contextLiterals = obj.contextLiterals.map(n => literalsNewEvent[n]);
			const literalsActiveEvent = obj.literalsActiveEvent === null ? null : obj.literalsActiveEvent.map(n => literalsNewEvent[n]);
			
			const clause = new Clause(literalsNewEvent, premiseLiterals, conclusionLiterals, contextLiterals);
			clause.literalsActiveEvent = literalsActiveEvent;
			return clause;
		}
	}

	static reconstructLiteral(obj): Literal {
		assert(obj.name !== undefined);
		assert(obj.args !== undefined);
		assert(obj.negated !== undefined);
		assert(obj.isSelected !== undefined);
		assert(obj.representation !== undefined);
		assert(obj.hideBracketsAssoc !== undefined);
		assert(obj.nonStrictForNegatedStrictInequalities !== undefined);
		assert(obj.orientationReason !== undefined);

		const args = obj.args.map(term => DagSerializer.reconstructTerm(term));
		
		const literal = new Literal(obj.name, args, obj.negated);
		literal.isSelected = obj.isSelected;
		literal.representation = obj.representation;
		literal.hideBracketsAssoc = obj.hideBracketsAssoc;
		literal.nonStrictForNegatedStrictInequalities = obj.nonStrictForNegatedStrictInequalities;
		literal.orientationReason = obj.orientationReason;

		return literal;
	}

	static reconstructTerm(obj): Term {
		assert(obj.name !== undefined);
		assert(obj.args !== undefined);

		const args = obj.args.map(term => DagSerializer.reconstructTerm(term));

		return new Term(obj.name, args);
	}
}
