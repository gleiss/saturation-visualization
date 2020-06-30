import { Dag } from "./dag";
import { Clause } from "./unit";
import { Literal } from "./literal";
import { assert } from "./util";
import { literalsMatch } from "./substitution";
import { DFPostOrderTraversal } from "./traversal";

// inferences, where
// 1) clause and parent clause have same number of literals
// 2) rewritten literals occur in the same position as the corresponding literal in the parent clause
function computeParentLiteralsCase1(literals: Array<Literal>, parentLiterals: Array<Literal>) {
	assert(literals.length === parentLiterals.length);

	for (let i = 0; i < literals.length; i++) {
		const literal = literals[i];
		const parentLiteral = parentLiterals[i];
		
		literal.setLiteralInParent(parentLiteral);
	}
}

// inferences which remove exactly one literal, where the order of the remaining literals is not changed
// need to find the position where the literals were removed
// note: this may compute a wrong matching if a literal in the side-part of the clause matches a deleted literal
//       in this case the wrongly matched literals in the parent are pairwise unifiable, so a sane user would assign to all of them the same orientation.
//       in particular the wrong matching should not affect the orientation-heuristic in practice
function computeParentLiteralsCase2(literals: Array<Literal>, parentLiterals: Array<Literal>, allowSubstitutions: boolean, allowMultipleRemovals: boolean) {
	assert(allowMultipleRemovals ? (literals.length < parentLiterals.length) : (literals.length + 1 === parentLiterals.length));

	let foundRemovedLit = false;
	let i = 0;
	let j = 0;
	while (i < literals.length) {
		const literal = literals[i];
		const parentLiteral = parentLiterals[j];

		const success = literalsMatch(literal, parentLiteral, allowSubstitutions);

		if (success) {
			literal.setLiteralInParent(parentLiteral);
			i = i + 1;
			j = j + 1;
		} else {
			assert(!foundRemovedLit || allowMultipleRemovals, `case 2 error:\n${literals.toString()}\n${parentLiterals.toString()}`);
			foundRemovedLit = true;
			j = j + 1;
		}
	}
}

// inferences, which rewrite exactly one literal, and shift that literal to the first position in literals
// need to find the position where the literal was rewritten
// note: this may compute a wrong matching if a literal in the side-part of the clause matches the rewritten literal in the parent
//       in this case the wrongly matched literals in the parent are pairwise unifiable, so a sane user would assign to all of them the same orientation.
//       in particular the wrong matching should not affect the orientation-heuristic in practice
// we also need to support simultanous superposition, which not only rewrites one literal and shifts that literal to the first position, but also allows other
// literals to be rewritten. In particular, we are then not able anymore to always succeed with matching literals. In that case, we try to do an educated guess
// of the ordering (in a way such that we compute the right literal matches at least in the case of non-simultanous superposition).
function computeParentLiteralsCase3(literals: Array<Literal>, parentLiterals: Array<Literal>, allowSubstitutions: boolean, allowSimultanousSuperposition: boolean) {
	assert(literals.length === parentLiterals.length, `case 3 error:\n${literals.toString()}\n${parentLiterals.toString()}`);

	let foundRewrittenLiteral = false;
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
		if (!allowSimultanousSuperposition) {
			assert(literalsMatch(literal, parentLiteral, allowSubstitutions), `case 3 error: literal ${i} doesn't match parent literal.\n${literals.toString()}\n${parentLiterals.toString()}\n`);
		}
		literal.setLiteralInParent(parentLiteral);
		i = i + 1;
	}
}


export function computeParentLiterals(dag: Dag) {
	for (const node of dag.nodes.values()) {
		if (!node.isBoundary && node.unit.type === "Clause") {
			const clause = node.unit as Clause;

			if (node.inferenceRule === "evaluation" ||
				node.inferenceRule === "forward subsumption demodulation" ||
				(node.inferenceRule === "term algebras injectivity" && node.parents.length === 1) ||
				node.inferenceRule === "subsumption resolution" ||
				node.inferenceRule === "equality resolution" ||
				node.inferenceRule === "trivial inequality removal" ||
				node.inferenceRule === "factoring" ||
				node.inferenceRule === "duplicate literal removal" ||
				(node.inferenceRule === "term algebras distinctness" && node.parents.length === 1) ||
				node.inferenceRule === "forward demodulation" ||
				node.inferenceRule === "backward demodulation" ||
				node.inferenceRule === "equality factoring") {
				assert(node.parents.length > 0);

				// we assume that the first parent is the main premise
				const parent = dag.get(node.parents[0]);

				// only compute literal matchings for clauses
				if (parent.unit.type === "Clause") {
					const parentClause = parent.unit as Clause;

					// compute literal ordering at the timepoint where clause was generated
					// note that the active-event can change the order of literals (since at this point the selected literals are computed and shifted to the front)
					assert(node.newTime !== null);
					assert(parent.newTime !== null);
					const parentWasAlreadyActivated = parent.activeTime !== null && parent.activeTime <= node.newTime!;
					const parentLiterals = parentWasAlreadyActivated ? parentClause.literalsActiveEvent! : parentClause.literalsNewEvent!;
					const literals = clause.literalsNewEvent!;
					assert(parentLiterals !== null);
					assert(literals !== null);

					// compute the literal-matchings
					// in full generality, this computation would be computationally expensive and a lot of implementation effort
					// instead, we hardcode computations of matchings for the most important inference rules implemented in Vampire, and don't compute matchings for other inferences
					if ((node.inferenceRule === "evaluation" && literals.length === parentLiterals.length) || 
						node.inferenceRule === "forward subsumption demodulation" ||
						node.inferenceRule === "term algebras injectivity") {

						computeParentLiteralsCase1(literals, parentLiterals);

					} else if (node.inferenceRule === "subsumption resolution" || 
						node.inferenceRule === "equality resolution" || 
						node.inferenceRule === "trivial inequality removal" ||
						node.inferenceRule === "factoring" ||
						node.inferenceRule === "duplicate literal removal" ||
						node.inferenceRule === "term algebras distinctness" ||
						(node.inferenceRule === "evaluation" && literals.length + 1 === parentLiterals.length)) {

						const allowSubstitutions = node.inferenceRule === "equality resolution" || node.inferenceRule === "factoring";
						const allowMultipleRemovals = node.inferenceRule === "trivial inequality removal" || node.inferenceRule === "duplicate literal removal";
						computeParentLiteralsCase2(literals, parentLiterals, allowSubstitutions, allowMultipleRemovals);

					} else if (node.inferenceRule === "forward demodulation" ||
						node.inferenceRule === "backward demodulation" ||
						node.inferenceRule === "equality factoring") {
						
						const allowSubstitutions = node.inferenceRule === "equality factoring";
						computeParentLiteralsCase3(literals, parentLiterals, allowSubstitutions, false);
					}
				}
			} else if (node.inferenceRule === "resolution" ||
				node.inferenceRule === "superposition") {
				assert(node.parents.length === 2);
				const leftNode = dag.get(node.parents[0]);
				const rightNode = dag.get(node.parents[1]);

				// only compute literal matchings for clauses
				if (leftNode.unit.type === "Clause" && rightNode.unit.type === "Clause") {
					const leftClause = leftNode.unit as Clause;
					const rightClause = rightNode.unit as Clause;

					// compute literal ordering at the timepoint where clause was generated
					// note again that the active-event can change the order of literals (since at this point the selected literals are computed and shifted to the front)
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
					assert(leftLiterals.length > 0);
					assert(rightLiterals.length > 0);

					if (node.inferenceRule === "resolution") {
						assert(literals.length + 2 === leftLiterals.length + rightLiterals.length);

						// compute matchings separately for literals coming from leftLiterals resp. rightLiterals
						// split denotes the first position in literals with a literal coming from rightLiterals
						const split = leftLiterals.length - 1;
						computeParentLiteralsCase2(literals.slice(0, split), leftLiterals, true, false);
						computeParentLiteralsCase2(literals.slice(split, literals.length), rightLiterals, true, false);

					} else if (node.inferenceRule === "superposition") {
						assert(literals.length + 1 === leftLiterals.length + rightLiterals.length);

						// compute matchings separately for literals coming from leftLiterals resp. rightLiterals
						// split denotes the first position in literals with a literal coming from rightLiterals
						const split = leftLiterals.length;
						computeParentLiteralsCase3(literals.slice(0, split), leftLiterals, true, true);
						computeParentLiteralsCase2(literals.slice(split, literals.length), rightLiterals, true, false);
					}
				}
			}
		}
	}
}

// update in the given dag:
// - literal orientations
// - literal representations
// - ordering of literals in premises and conclusions
// if changedClauseId is null, update all nodes in the dag
// if changedClauseId is the id of a clause, update the node and all children of the node
// Precondition: computeParentLiterals was already called on the current dag
export function computeClauseRepresentation(dag: Dag, changedClauseId: number | null): Set<number> {
	assert(changedClauseId === null || dag.nodes.has(changedClauseId));

	const changedClauses = new Set<number>();
	if (changedClauseId !== null) {
		changedClauses.add(changedClauseId);
	}

	const iterator = new DFPostOrderTraversal(dag);
	while (iterator.hasNext()) {
		let node = iterator.getNext();

		if (!node.isBoundary && node.unit.type === "Clause") {
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

			// Part 1: partition literals into premise and conclusion and compute literal-representation
			// Hack: Vampire by default uses "equality resolution with deletion" as inference rule during preprocessing.
			//       Unfortunately the produced inference is named "equality resolution" and therefore clashes with
			//       inferences produced by the generating inference rule with the same name.
			//       We therefore check that inferences with name "equality resolution" are not "equality resolution with deletion"-inferences.
			const isEqualityResolutionWithDeletion = node.inferenceRule === "equality resolution" && dag.get(node.parents[0]).isFromPreprocessing === true;
			const propagateSingleParent = node.inferenceRule === "subsumption resolution" ||
				(node.inferenceRule === "equality resolution" && !isEqualityResolutionWithDeletion) ||
				node.inferenceRule === "equality factoring" ||
				node.inferenceRule === "forward demodulation" ||
				node.inferenceRule === "backward demodulation" ||
				node.inferenceRule === "forward subsumption demodulation" ||
				node.inferenceRule === "factoring" ||
				node.inferenceRule === "duplicate literal removal" ||
				node.inferenceRule === "evaluation" ||
				node.inferenceRule === "trivial inequality removal" ||
				(node.inferenceRule === "term algebras injectivity" && node.parents.length === 1) ||
				(node.inferenceRule === "term algebras distinctness" && node.parents.length === 1);
			const propagateTwoParents = node.inferenceRule === "resolution" ||
				node.inferenceRule === "superposition";

			const premiseLiterals = new Array<Literal>();
			const conclusionLiterals = new Array<Literal>();
			const contextLiterals = new Array<Literal>();
			for (const literal of clause.premiseLiterals.concat(clause.conclusionLiterals, clause.contextLiterals)) {

				let orientation: "premise" | "conclusion" | "context" | null = null;

				const parentLiteral = literal.literalInParent;
				if (literal.orientationReason !== "user" && (propagateSingleParent || propagateTwoParents)) {
					assert(parentLiteral !== null);
					// propagate orientation and representation from parent literal
					literal.representation = parentLiteral!.representation;
					if (propagateSingleParent) {
						assert(node.parents.length > 0);

						// we assume that the first parent is the main premise
						const parent = dag.get(node.parents[0]);

						if (parent.unit.type === "Clause") {
							const parentClause = parent.unit as Clause;
							// figure out whether parentLiteral occurs in premise or conclusion and set orientation accordingly
							if (parentClause.premiseLiterals.find(l => l === parentLiteral)) {
								orientation = "premise";
							} else if (parentClause.conclusionLiterals.find(l => l === parentLiteral)) {
								orientation = "conclusion";
							} else {
								assert(parentClause.contextLiterals.find(l => l === parentLiteral));
								orientation = "context";
							}
						}
					} else if (propagateTwoParents) {
						assert(node.parents.length === 2);
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
							} else if (leftClause.contextLiterals.find(l => l === parentLiteral)) {
								orientation = "context";
							} else if (rightClause.premiseLiterals.find(l => l === parentLiteral)) {
								orientation = "premise";
							} else if (rightClause.conclusionLiterals.find(l => l === parentLiteral)) {
								orientation = "conclusion";
							} else {
								assert(rightClause.contextLiterals.find(l => l === parentLiteral));
								orientation = "context";
							}
						}
					}
					literal.orientationReason = "inherited"
				}

				// otherwise decide whether current orientation should be kept or whether it should be computed using a heuristic
				else if (literal.orientationReason !== "none" ) {
					if (clause.premiseLiterals.find(l => l === literal)) {
						orientation = "premise";
					} else if (clause.conclusionLiterals.find(l => l === literal)) {
						orientation = "conclusion";
					} else {
						assert(clause.contextLiterals.find(l => l === literal))
						orientation = "context";
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
				} else if (orientation === "conclusion") {
					conclusionLiterals.push(literal);
				} else {
					assert(orientation === "context");
					contextLiterals.push(literal);
				}
			}

			// Part 2: order literals according to the order of literals in the parents
			// only sort if no manually oriented literal in clause
			let existsUserOrientedLiteral = false;
			for (const literal of clause.premiseLiterals.concat(clause.conclusionLiterals, clause.contextLiterals)) {
				if (literal.orientationReason === "user") {
					existsUserOrientedLiteral = true;
					break;
				}
			}
			if (!existsUserOrientedLiteral && propagateSingleParent) {
				// we assume that the first parent is the main premise
				const parent = dag.get(node.parents[0]);
				
				if (parent.unit.type === "Clause") {
					const parentClause = parent.unit as Clause;

					// generate map parentLiteral -> indexInPremise
					const premiseIndexMap = new Map<Literal, number>();
					for (let i = 0; i < parentClause.premiseLiterals.length; i++) {
						const parentLiteral = parentClause.premiseLiterals[i];
						premiseIndexMap.set(parentLiteral, i);
					}
					// generate map parentLiteral -> indexInConclusion
					const conclusionIndexMap = new Map<Literal, number>();
					for (let i = 0; i < parentClause.conclusionLiterals.length; i++) {
						const parentLiteral = parentClause.conclusionLiterals[i];
						conclusionIndexMap.set(parentLiteral, i);
					}
					// generate map parentLiteral -> indexInContext
					const contextIndexMap = new Map<Literal, number>();
					for (let i = 0; i < parentClause.contextLiterals.length; i++) {
						const parentLiteral = parentClause.contextLiterals[i];
						contextIndexMap.set(parentLiteral, i);
					}
					// sort premise, conclusion and context
					premiseLiterals.sort((lit1: Literal, lit2: Literal) => {
						assert(lit1.literalInParent !== null);
						assert(lit2.literalInParent !== null);
						const index1 = premiseIndexMap.get(lit1.literalInParent!);
						const index2 = premiseIndexMap.get(lit2.literalInParent!);
						assert(index1 !== undefined);
						assert(index2 !== undefined);
						return index1! - index2!;
					});
					conclusionLiterals.sort((lit1: Literal, lit2: Literal) => {
						assert(lit1.literalInParent !== null);
						assert(lit2.literalInParent !== null);
						const index1 = conclusionIndexMap.get(lit1.literalInParent!);
						const index2 = conclusionIndexMap.get(lit2.literalInParent!);
						assert(index1 !== undefined);
						assert(index2 !== undefined);
						return index1! - index2!;
					});
					contextLiterals.sort((lit1: Literal, lit2: Literal) => {
						assert(lit1.literalInParent !== null);
						assert(lit2.literalInParent !== null);
						const index1 = contextIndexMap.get(lit1.literalInParent!);
						const index2 = contextIndexMap.get(lit2.literalInParent!);
						assert(index1 !== undefined);
						assert(index2 !== undefined);
						return index1! - index2!;
					});
				}
			} else if (!existsUserOrientedLiteral && propagateTwoParents) {
				assert(node.parents.length === 2);
				const leftNode = dag.get(node.parents[0]);
				const rightNode = dag.get(node.parents[1]);
				if (leftNode.unit.type === "Clause" && rightNode.unit.type === "Clause") {
					const leftClause = leftNode.unit as Clause;
					const rightClause = rightNode.unit as Clause;

					// generate map leftLiteral/rightLiteral -> indexInPremise
					// ensure that rightLiterals have a higher index than leftLiterals
					const premiseIndexMap = new Map<Literal, number>();
					for (let i = 0; i < leftClause.premiseLiterals.length; i++) {
						const parentLiteral = leftClause.premiseLiterals[i];
						premiseIndexMap.set(parentLiteral, i);
					}
					for (let i = 0; i < rightClause.premiseLiterals.length; i++) {
						const parentLiteral = rightClause.premiseLiterals[i];
						premiseIndexMap.set(parentLiteral, i + leftClause.premiseLiterals.length);
					}
					// generate map leftLiteral/rightLiteral -> indexInConclusion
					// ensure that rightLiterals have a higher index than leftLiterals
					const conclusionIndexMap = new Map<Literal, number>();
					for (let i = 0; i < leftClause.conclusionLiterals.length; i++) {
						const parentLiteral = leftClause.conclusionLiterals[i];
						conclusionIndexMap.set(parentLiteral, i);
					}
					for (let i = 0; i < rightClause.conclusionLiterals.length; i++) {
						const parentLiteral = rightClause.conclusionLiterals[i];
						conclusionIndexMap.set(parentLiteral, i + leftClause.conclusionLiterals.length);
					}
					// generate map leftLiteral/rightLiteral -> indexInContext
					// ensure that rightLiterals have a higher index than leftLiterals
					const contextIndexMap = new Map<Literal, number>();
					for (let i = 0; i < leftClause.contextLiterals.length; i++) {
						const parentLiteral = leftClause.contextLiterals[i];
						contextIndexMap.set(parentLiteral, i);
					}
					for (let i = 0; i < rightClause.contextLiterals.length; i++) {
						const parentLiteral = rightClause.contextLiterals[i];
						contextIndexMap.set(parentLiteral, i + leftClause.contextLiterals.length);
					}

					// sort premise, conclusion and context
					premiseLiterals.sort((lit1: Literal, lit2: Literal) => {
						assert(lit1.literalInParent !== null);
						assert(lit2.literalInParent !== null);
						const index1 = premiseIndexMap.get(lit1.literalInParent!);
						const index2 = premiseIndexMap.get(lit2.literalInParent!);
						assert(index1 !== undefined);
						assert(index2 !== undefined);
						return index1! - index2!;
					});
					conclusionLiterals.sort((lit1: Literal, lit2: Literal) => {
						assert(lit1.literalInParent !== null);
						assert(lit2.literalInParent !== null);
						const index1 = conclusionIndexMap.get(lit1.literalInParent!);
						const index2 = conclusionIndexMap.get(lit2.literalInParent!);
						assert(index1 !== undefined);
						assert(index2 !== undefined);
						return index1! - index2!;
					});
					contextLiterals.sort((lit1: Literal, lit2: Literal) => {
						assert(lit1.literalInParent !== null);
						assert(lit2.literalInParent !== null);
						const index1 = contextIndexMap.get(lit1.literalInParent!);
						const index2 = contextIndexMap.get(lit2.literalInParent!);
						assert(index1 !== undefined);
						assert(index2 !== undefined);
						return index1! - index2!;
					});
				}
			}

			// Part 3: update literals
			clause.premiseLiterals = premiseLiterals;
			clause.conclusionLiterals = conclusionLiterals;
			clause.contextLiterals = contextLiterals;

			// Part 4: mark clause to be changed
			changedClauses.add(node.id);
		}
	}

	return changedClauses;
}





