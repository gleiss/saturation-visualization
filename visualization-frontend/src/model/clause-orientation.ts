import { Dag } from "./dag";
import { Clause } from "./unit";
import { Literal } from "./literal";

export function orientClauses(dag: Dag) {
	for (const node of dag.nodes.values()) {
		if (node.unit.type === "Clause") {
			const clause = node.unit as Clause;
			
			const literals = clause.premiseLiterals.concat(clause.conclusionLiterals);

			// simple heuristic for orienting literals: negated literal which are no equalities are premise-literals, all other literals are conclusion-literals
			const conclusionLiteralRemains = literals.reduce((acc, literal) => acc || (!literal.negated || literal.name === "="),false);
			if (conclusionLiteralRemains) {
				const premiseLiterals = new Array<Literal>();
				const conclusionLiterals = new Array<Literal>();
				for (const literal of literals) {
					if (literal.negated && literal.name !== "=") {
						premiseLiterals.push(literal);
					} else {
						conclusionLiterals.push(literal);
					}
				}
				clause.premiseLiterals = premiseLiterals;
				clause.conclusionLiterals = conclusionLiterals;
			} else {
				clause.premiseLiterals = [];
				clause.conclusionLiterals = literals;
			}
		}
	}
}





