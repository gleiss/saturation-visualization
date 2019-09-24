import { Literal, Term } from "./literal";
import { assert } from "./util";

export type Substitution = Map<string, Term>;

export function literalsMatch(literal1: Literal, literal2: Literal, allowSubstitutions: boolean) {
	if (allowSubstitutions) {
		return isSubstitution(literal1, literal2);
	} else {
		return isEqual(literal1, literal2);
	}
}

export function isEqual(literal1: Literal, literal2: Literal): boolean {
	if (literal1.name !== literal2.name || literal1.negated !== literal2.negated || literal1.args.length !== literal2.args.length) {
		return false;
	}
	let success = true;
	for (let i = 0; i < literal1.args.length; i++) {
		const arg1 = literal1.args[i];
		const arg2 = literal2.args[i];
		if (!termsAreEqual(arg1,arg2)) {
			success = false;
			break;
		}
	}

	// support commutativity of equalities
	if (!success && literal1.name === "=") {
		assert(literal1.args.length === 2);
		success = 
			termsAreEqual(literal1.args[0], literal2.args[1]) &&
			termsAreEqual(literal1.args[1], literal2.args[0]);
	}

	return success;
}

export function termsAreEqual(f1: Term, f2: Term) {
	if (f1.name !== f2.name || f1.args.length !== f2.args.length) {
		return false;
	}

	for (let i = 0; i < f1.args.length; i++) {
		const arg1 = f1.args[i];
		const arg2 = f2.args[i];
		if (!termsAreEqual(arg1,arg2)) {
			return false;
		}
	}
	return true;
}

// returns true if literal1 can be obtained from literal2 by substitution
export function isSubstitution(literal1: Literal, literal2: Literal): boolean {
	if (literal1.name !== literal2.name || literal1.negated !== literal2.negated || literal1.args.length !== literal2.args.length) {
		return false;
	}
	let success = true;
	const substitution = new Map<string, Term>();
	for (let i = 0; i < literal1.args.length; i++) {
		const arg1 = literal1.args[i];
		const arg2 = literal2.args[i];
		success = computeSubstitution(arg1,arg2, substitution);
		if (!success) {
			break;
		}
	}
	
	// support commutativity of equalities
	if (!success && literal1.name === "=") {
		assert(literal1.args.length === 2);
		const substitutionEq = new Map<string, Term>();
		success = computeSubstitution(literal1.args[0], literal2.args[1], substitutionEq);
		if (success) {
			success = computeSubstitution(literal1.args[1], literal2.args[0], substitutionEq);
		}
	}
	
	return success;
}

// compute whether f1 can be obtained from f2 using a substitution compatible with substitution
// if yes, returns true and updates the substitution
// if no, returns false, and there are no guarantees on the state of substitution
export function computeSubstitution(f1: Term, f2: Term, substitution: Substitution): boolean {
	if (f1.name === f2.name && f1.args.length === f2.args.length) {
		for (let i = 0; i < f1.args.length; i++) {
			const arg1 = f1.args[i];
			const arg2 = f2.args[i];
			const success = computeSubstitution(arg1,arg2, substitution);
			if (!success) {
				return false;
			}
		}
		return true;
	} else if (f2.isVariable) {
		const substitutedVariable = substitution.get(f2.name);
		if (substitutedVariable === undefined) {
			substitution.set(f2.name, f1);
			return true;
		} else {
			return computeSubstitution(f1, substitutedVariable, substitution);
		}
	} else {
		return false;
	}
}