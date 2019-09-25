import { Dag } from "./dag";
import { Clause } from "./unit";
import { Literal } from "./literal";
import { assert } from "./util";
import { literalsMatch } from "./substitution";
import { DFPostOrderTraversal } from "./traversal";

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

							const matched = literalsMatch(literal, parentLiteral, true)
							if (matched) {
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

// update literal orientations in the given dag
// if changedClauseId is null, update all nodes in the dag
// if changedClauseId is the id of a clause, update the node and all children of the node
export function orientClauses(dag: Dag, changedClauseId: number | null): Set<number> {
	assert(changedClauseId === null || dag.nodes.has(changedClauseId));

	const changedClauses = new Set<number>();
	if (changedClauseId !== null) {
		changedClauses.add(changedClauseId);
	}

	const iterator = new DFPostOrderTraversal(dag);
	while (iterator.hasNext()) {
		let node = iterator.getNext();

		if (node.unit.type === "Clause") {
			const clause = node.unit as Clause;

			// compute whether clause should be updated. This is the case if
			// 1) all nodes should be updated (since changedClauseId === null)
			// 2) the node is changedClauseId
			// 3) a parent of node was changed
			let update = changedClauseId === null || node.id === changedClauseId;
			if (!update) {
				for (const parentId of node.parents) {
					if (changedClauses.has(parentId)) {
						update = true;
						break;
					}
				}
			}
			if (!update) {
				continue;
			}

			// TODO: sanity check that all literals were set in the cases we support: suitable inference + parents are clauses

			// Part 1: partition literals into premise and conclusion
			const propagateSingleParent = node.inferenceRule === "subsumption resolution" ||
				node.inferenceRule === "equality resolution" ||
				node.inferenceRule === "equality factoring" ||
				node.inferenceRule === "forward demodulation" ||
				node.inferenceRule === "backward demodulation" ||
				node.inferenceRule === "forward subsumption demodulation" ||
				node.inferenceRule === "factoring" ||
				node.inferenceRule === "duplicate literal removal" ||
				node.inferenceRule === "evaluation" ||
				node.inferenceRule === "trivial inequality removal";
			const propagateTwoParents = node.inferenceRule === "resolution" ||
				node.inferenceRule === "superposition";

			const premiseLiterals = new Array<Literal>();
			const conclusionLiterals = new Array<Literal>();
			for (const literal of clause.premiseLiterals.concat(clause.conclusionLiterals)) {

				let orientation: "premise" | "conclusion" | null = null;
				const parentLiteral = literal.literalInParent;
				if (parentLiteral !== null && literal.orientationReason !== "user" && (propagateSingleParent || propagateTwoParents)) {
					// Case 2: propagate orientation from parent literal
					if (propagateSingleParent) {
						assert(node.parents.length > 0);
						const hasSwitchedParents = node.inferenceRule === "backward demodulation"
						const parent = dag.get(node.parents[hasSwitchedParents ? 1 : 0]);
						
						if (parent.unit.type === "Clause") {
							const parentClause = parent.unit as Clause;
							// figure out whether parentLiteral occurs in premise or conclusion and set orientation accordingly
							if (parentClause.premiseLiterals.find(l => l === parentLiteral)) {
								orientation = "premise";
							} else {
								assert(parentClause.conclusionLiterals.find(l => l === parentLiteral));
								orientation = "conclusion";
							}
						}
					} else if (propagateTwoParents) {
						assert(node.parents.length == 2);
						const leftNode = dag.get(node.parents[0]);
						const rightNode = dag.get(node.parents[1]);
						if (leftNode.unit.type === "Clause" && rightNode.unit.type === "Clause") {
							const leftClause = leftNode.unit as Clause;
							const rightClause = rightNode.unit as Clause;
							// figure out whether parentLiteral occurs in premise or conclusion of left or right premise and set orientation accordingly
							if (leftClause.premiseLiterals.find(l => l === parentLiteral)) {
								orientation = "premise";
							} else if (leftClause.conclusionLiterals.find(l => l === parentLiteral)) {
								orientation = "conclusion";
							} else if (rightClause.premiseLiterals.find(l => l === parentLiteral)) {
								orientation = "premise";
							} else {
								assert(rightClause.conclusionLiterals.find(l => l === parentLiteral));
								orientation = "conclusion";
							}
						}
					}
					literal.orientationReason = "inherited"
				}

				// otherwise decide whether current orientation should be kept or whether it should be computed using a heuristic
				else if (literal.orientationReason !== "none" ) {
					if (clause.premiseLiterals.find(l => l === literal)) {
						orientation = "premise";
					} else {
						assert(clause.conclusionLiterals.find(l => l === literal))
						orientation = "conclusion";
					}
				}
				else {
					// use heuristic to compute orientation
					if (literal.negated && literal.name !== "=") {
						orientation = "premise";
					} else {
						orientation = "conclusion";
					}
					literal.orientationReason = "heuristic";
				}

				if (orientation === "premise") {
					premiseLiterals.push(literal);
				} else {
					assert(orientation === "conclusion");
					conclusionLiterals.push(literal);
				}
			}

			// Part 2: update literals
			clause.premiseLiterals = premiseLiterals;
			clause.conclusionLiterals = conclusionLiterals;

			// Part 3: mark clause to be changed
			changedClauses.add(node.id);
		}
	}

	return changedClauses;
}





