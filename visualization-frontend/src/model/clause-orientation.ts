import { Dag } from "./dag";
import { Clause } from "./unit";
import { Literal } from "./literal";
import { assert } from "./util";
import { isSubstitution, isEqual } from "./substitution";

function literalsMatch(literal1: Literal, literal2: Literal, allowSubstitutions: boolean) {
	if (allowSubstitutions) {
		return isSubstitution(literal1, literal2);
	} else {
		return isEqual(literal1, literal2);
	}
}

export function computeParentLiterals(dag: Dag) {
	for (const node of dag.nodes.values()) {
		if (node.unit.type === "Clause") {
			const clause = node.unit as Clause;

			if (node.inferenceRule === "subsumption resolution" ||
				node.inferenceRule === "equality resolution" ||
				node.inferenceRule === "equality factoring" ||
				node.inferenceRule === "forward demodulation" ||
				node.inferenceRule === "backward demodulation" ||
				node.inferenceRule === "forward subsumption demodulation" ||
				node.inferenceRule === "factoring" ||
				node.inferenceRule === "duplicate literal removal" ||
				node.inferenceRule === "evaluation" ||
				node.inferenceRule === "trivial inequality removal") {
				assert(node.parents.length > 0);
				const hasSwitchedParents = node.inferenceRule === "backward demodulation"
				const parent = dag.get(node.parents[hasSwitchedParents ? 1 : 0]);

				if (parent.unit.type === "Clause") {
					const parentClause = parent.unit as Clause;

					// compute literal ordering at the timepoint where clause was generated
					assert(node.newTime !== null);
					assert(parent.newTime !== null);
					const parentWasAlreadyActivated = parent.activeTime !== null && parent.activeTime <= node.newTime!;
					const parentLiterals = parentWasAlreadyActivated ? parentClause.literalsActiveEvent! : parentClause.literalsNewEvent!;

					const literals = clause.literalsNewEvent!;

					assert(parentLiterals !== null);
					assert(literals !== null);

					if ((node.inferenceRule === "evaluation" && literals.length === parentLiterals.length) || 
						node.inferenceRule === "forward subsumption demodulation") {
						// inferences, where
						// 1) clause and parent clause have same number of literals
						// 2) rewritten literals occur in the same position as the corresponding literal in the parent clause
						assert(literals.length === parentLiterals.length);
						for (let i = 0; i < literals.length; i++) {
							const literal = literals[i];
							const parentLiteral = parentLiterals[i];
							
							literal.setLiteralInParent(parentLiteral);
						}
					} else if (node.inferenceRule === "subsumption resolution" || 
						node.inferenceRule === "equality resolution" || 
						node.inferenceRule === "trivial inequality removal" ||
						(node.inferenceRule === "evaluation" && literals.length + 1 === parentLiterals.length)) {
						// inferences which remove exactly one literal
						// need to find the position where the literal was removed
						let success = true;
						let foundRemovedLit = false;
						assert(literals.length + 1 === parentLiterals.length);
						let i = 0;
						let j = 0;
						while (i < literals.length) {
							const literal = literals[i];
							const parentLiteral = parentLiterals[j];

							const allowSubstitutions = node.inferenceRule === "equality resolution";
							success = literalsMatch(literal, parentLiteral, allowSubstitutions);

							if (success) {
								literal.setLiteralInParent(parentLiteral);
								i = i + 1;
								j = j + 1;
							} else {
								const multipleRemovalsAllowed = node.inferenceRule === "trivial inequality removal";
								if (!foundRemovedLit || multipleRemovalsAllowed) {
									foundRemovedLit = true;
									j = j + 1;
								} else {
									// found unexpected literal
									success = false;
									break;
								}
							}
						}
						assert(success, `case 2 error for id ${node.id}:\n${literals.toString()}\n${parentLiterals.toString()}`);
					} else if (node.inferenceRule === "forward demodulation" ||
						node.inferenceRule === "backward demodulation" ||
						node.inferenceRule === "equality factoring") {
						// inferences, which rewrite exactly one literal
						// need to find the position where the literal was rewritten
						const allowSubstitutions = node.inferenceRule === "equality factoring";

						assert(literals.length === parentLiterals.length);

						for (const literal of clause.literalsNewEvent!) {
							assert(literal.literalInParent === null);
						}
						let foundRewrittenLiteral = false;
						
						assert(!literalsMatch(literals[0], parentLiterals[0], allowSubstitutions));
						let i = 1;
						// first shifted matchings can occur
						while(i < literals.length) {
							const literal = literals[i];
							const parentLiteral = parentLiterals[i - 1];

							if (literalsMatch(literal, parentLiteral, allowSubstitutions)) {
								literal.setLiteralInParent(parentLiteral);
								i = i + 1;
							} else {
								// shifted matching failed, so parentLiterals[i - 1] must be rewrittenLiteral
								literals[0].setLiteralInParent(parentLiterals[i - 1]);
								foundRewrittenLiteral = true;
								break;
							}
						}
						// corner case where rewritten literal is last element of parent clause and therefore has no failing shifted matching
						if (!foundRewrittenLiteral) {
							assert(i === literals.length);
							literals[0].setLiteralInParent(parentLiterals[parentLiterals.length - 1]);
						}
						// now nonshifted matchings can occur
						while(i < literals.length) {
							const literal = literals[i];
							const parentLiteral = parentLiterals[i];
							assert(literalsMatch(literal, parentLiteral, allowSubstitutions));
							literal.setLiteralInParent(parentLiteral);
							i = i + 1;
						}
					} else if (node.inferenceRule === "factoring" ||
						node.inferenceRule === "duplicate literal removal") {
						assert(literals.length < parentLiterals.length);

						let i = 0;
						let j = 0;
						while (i < literals.length) {
							const literal = literals[i];
							const parentLiteral = parentLiterals[j];

							const allowSubstitutions = node.inferenceRule === "factoring";
							const matched = literalsMatch(literal, parentLiteral, allowSubstitutions);
							if (matched) {
								literal.setLiteralInParent(parentLiteral);
								i = i + 1;
								j = j + 1;
							} else {
								j = j + 1;
							}
						}
					}
				}
			} else if (node.inferenceRule === "resolution" ||
				node.inferenceRule === "superposition") {
				assert(node.parents.length == 2);
				const leftNode = dag.get(node.parents[0]);
				const rightNode = dag.get(node.parents[1]);
				if (leftNode.unit.type === "Clause" && rightNode.unit.type === "Clause") {
					const leftClause = leftNode.unit as Clause;
					const rightClause = rightNode.unit as Clause;

					// compute literal ordering at the timepoint where clause was generated
					assert(node.newTime !== null);
					assert(leftNode.newTime !== null);
					assert(rightNode.newTime !== null);
					const leftWasAlreadyActivated = leftNode.activeTime !== null && leftNode.activeTime <= node.newTime!;
					const rightWasAlreadyActivated = rightNode.activeTime !== null && rightNode.activeTime <= node.newTime!;

					const leftLiterals = leftWasAlreadyActivated ? leftClause.literalsActiveEvent! : leftClause.literalsNewEvent!;
					const rightLiterals = rightWasAlreadyActivated ? rightClause.literalsActiveEvent! : rightClause.literalsNewEvent!;
					const literals = clause.literalsNewEvent!;

					assert(leftLiterals !== null);
					assert(rightLiterals !== null);
					assert(literals !== null);

					if (node.inferenceRule === "resolution") {
						let success = true;
						let foundResolvedLeft = false;
						let foundResolvedRight = false;
						assert(literals.length + 2 == leftLiterals.length + rightLiterals.length);
						let i = 0;
						let j = 0;
						while (i < literals.length) {
							const literal = literals[i];
							const parentLiteral = j < leftLiterals.length ? leftLiterals[j] : rightLiterals[j-leftLiterals.length];
			
							const matched = literalsMatch(literal, parentLiteral, true)
							if (matched) {
								literal.setLiteralInParent(parentLiteral);
								i = i + 1;
								j = j + 1;
							} else {
								if (!foundResolvedLeft) {
									foundResolvedLeft = true;
									j = j + 1;
								} else if (!foundResolvedRight) {
									foundResolvedRight = true;
									j = j + 1
								} else {
									// found unexpected literal
									success = false;
									break;
								}
							}
						}
						assert(success, `resolution error for id ${node.id}:\n${literals.toString()}\n${leftLiterals.toString()}\n${rightLiterals.toString()}`);
					} else if (node.inferenceRule === "superposition") {
						let success = true;
						let rewrittenLiteral = false;
						let foundParentLiteral = false;
						assert(literals.length + 1 == leftLiterals.length + rightLiterals.length);
						assert(rightLiterals.length >= 1);

						let i = 1;
						let j = 0;

						while (i < literals.length && j < leftLiterals.length) {
							const literal = literals[i];
							const parentLiteral = leftLiterals[j];

							const matched = literalsMatch(literal, parentLiteral, true)
							if (matched) {
								literal.setLiteralInParent(parentLiteral);
								i = i + 1;
								j = j + 1;
							} else {
								if (!rewrittenLiteral) {
									// literals[0] must be the result of rewriting leftLiterals[j]
									literals[0].setLiteralInParent(parentLiteral);
									rewrittenLiteral = true;
									j = j + 1;
								} else {
									// found unexpected literal
									success = false;
									break;
								}
							}
						}
						if (!rewrittenLiteral) {
							assert(j + 1 === leftLiterals.length);
							// literals[0] must be the result of rewriting leftLiterals[j]
							literals[0].setLiteralInParent(leftLiterals[j]);
						}
						assert(i === leftLiterals.length);
						j = 0;
						while (i < literals.length && j < rightLiterals.length) {
							const literal = literals[i];
							const parentLiteral = rightLiterals[j];
							if (isSubstitution(literal, parentLiteral)) {
								literal.setLiteralInParent(parentLiteral);
								i = i + 1;
								j = j + 1;
							} else {
								if (!foundParentLiteral) {
									// parentLiterals[j] must be the equality used for superposition
									foundParentLiteral = true;
									j = j + 1;
								} else {
									// found unexpected literal
									success = false;
									break;
								}
							}
						}
						if (!foundParentLiteral) {
							assert(j + 1 === rightLiterals.length);
							// leftLiterals[j] must be the equality used for superposition
						}
						assert(success, `superposition error for id ${node.id}:\n${literals.toString()}\n${leftLiterals.toString()}\n${rightLiterals.toString()}`);
					}
				}
			}
		}
	}
}

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





