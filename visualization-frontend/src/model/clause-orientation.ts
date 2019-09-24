import { Dag } from "./dag";
import { Clause } from "./unit";
import { Literal } from "./literal";
import { assert } from "./util";
import { isSubstitution } from "./substitution";

function literalsMatch(literal1: Literal, literal2: Literal, allowSubstitutions: boolean) {
	if (allowSubstitutions) {
		return isSubstitution(literal1, literal2);
	} else {
		return literal1.toString(true) === literal2.toString(true);
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
						let success = true;
						for (let i = 0; i < literals.length; i++) {
							const literal = literals[i];
							const parentLiteral = parentLiterals[i];
							// literals[i] is matched with parentLiterals[i]
						}
						// console.log("case 1 worked!");
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
						if (success) {
							// console.log("case 2 worked!");
						} else {
							console.log(`case 2 error for id ${node.id}:\n${literals.toString()}\n${parentLiterals.toString()}`);
						}
					} else if (node.inferenceRule === "forward demodulation" ||
						node.inferenceRule === "backward demodulation" ||
						node.inferenceRule === "equality factoring") {
						// inferences, which rewrite exactly one literal
						// need to find the position where the literal was rewritten
						let success = true;
						assert(literals.length === parentLiterals.length);

						let i = 0;
						let j = 0;
						let foundRewrittenLiteral = false;
						let foundParentLiteral = false;
						while (i < literals.length) {
							const literal = literals[i];
							const parentLiteral = parentLiterals[j];

							const allowSubstitutions = node.inferenceRule === "equality factoring";
							const matched = literalsMatch(literal, parentLiteral, allowSubstitutions);
							if (matched) {
								i = i + 1;
								j = j + 1;
							} else {
								// if we already found the rewritten literal
								if (foundRewrittenLiteral) {
									if (foundParentLiteral) {
										// found unexpected literal
										success = false;
										break;
									} else {
										// rewrittenLiteral must be the result of rewriting parentLiterals[j]
										foundParentLiteral = true;
										j = j + 1;
									}
								} else if (i + 1 === literals.length && j + 1 === parentLiterals.length) {
									// all literals were matched except the last ones, so the only literal
									// we can match with literals[i] is parentLiterals[j]
									foundRewrittenLiteral = true;
									foundParentLiteral = true;
									i = i + 1;
									j = j + 1;
								} else {
									// check whether next pair matches
									const successNext = literalsMatch(literals[i+1], parentLiterals[j+1], allowSubstitutions);
									if (successNext) {
										// literal[i] must be the result of rewriting parentLiterals[j]
										foundRewrittenLiteral = true;
										foundParentLiteral = true;
										i = i + 1;
										j = j + 1;
									} else {
										foundRewrittenLiteral = true;
										i = i + 1;
									}
								}
							}
						}
						if (foundRewrittenLiteral && !foundParentLiteral) {
							assert(j + 1 === parentLiterals.length);
							// rewrittenLiteral must be the result of rewriting last literal of parentLiterals
						}
						if (success) {
							// console.log("case 3 worked!");
						} else {
							console.log(`case 3 error for id ${node.id}:\n${literals.toString()}\n${parentLiterals.toString()}`);
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
								i = i + 1;
								j = j + 1;
							} else {
								j = j + 1;
							}
						}
						// console.log("factoring worked!");
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
			
							if (isSubstitution(literal, parentLiteral)) {
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
						if (success) {
							// console.log("resolution worked!")
						} else {
							console.log(`resolution error for id ${node.id}:\n${literals.toString()}\n${leftLiterals.toString()}\n${rightLiterals.toString()}`);
						}
					} else if (node.inferenceRule === "superposition") {
						let success = true;
						let foundRewrittenLiteral = false;
						let foundParentLiteral = false;
						assert(literals.length + 1 == leftLiterals.length + rightLiterals.length);
						assert(rightLiterals.length >= 1);

						let i = 1;
						let j = 0;

						while (i < literals.length && j < leftLiterals.length) {
							const literal = literals[i];
							if (literal === undefined) {
								console.log(literals);
								console.log(leftLiterals);
							}
							const parentLiteral = leftLiterals[j];
							if (isSubstitution(literal, parentLiteral)) {
								i = i + 1;
								j = j + 1;
							} else {
								if (!foundRewrittenLiteral) {
									// literals[0] must be the result of rewriting leftLiterals[j]
									foundRewrittenLiteral = true;
									j = j + 1;
								} else {
									// found unexpected literal
									success = false;
									break;
								}
							}
						}
						if (!foundRewrittenLiteral) {
							assert(j + 1 === leftLiterals.length);
							// literals[0] must be the result of rewriting leftLiterals[j]
						}
						assert(i === leftLiterals.length);
						j = 0;
						while (i < literals.length && j < rightLiterals.length) {
							const literal = literals[i];
							const parentLiteral = rightLiterals[j];
							if (isSubstitution(literal, parentLiteral)) {
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
						if (success) {
							// console.log("superposition worked!");
						} else {
							console.log(`superposition error for id ${node.id}:\n${literals.toString()}\n${leftLiterals.toString()}\n${rightLiterals.toString()}`);
						}
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





