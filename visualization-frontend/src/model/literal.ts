import { assert } from "./util";

export class Literal {
	readonly name: string;
	readonly args: Term[];
	readonly negated: boolean;
	isSelected: boolean;
	representation: number;
	hideBracketsAssoc: boolean;
	nonStrictForNegatedStrictInequalities: boolean;
	literalInParent: Literal | null;
	orientationReason: "user" | "inherited" | "heuristic" | "none";

	constructor(name:string, args: Term[], negated: boolean){
		this.name = name;
		this.args = args;
		this.negated = negated;
		this.isSelected = false;
		this.representation = 0; // 0 represents standard representation. Some literals may define other representations
		this.hideBracketsAssoc = true;
		this.nonStrictForNegatedStrictInequalities = true;
		this.literalInParent = null;
		this.orientationReason = "none";
	}

	setLiteralInParent(literalInParent: Literal) {
		this.literalInParent = literalInParent;
	}

	switchToNextRepresentation() {
		if (this.name === "$less" || this.name === "Sub") {
			if (this.representation === 0) {
				this.representation = 1;
			} else {
				this.representation = 0;
			}
		}
	}

	toString(negateLiteral: boolean) : string {
		const occursNegated = negateLiteral ? !this.negated : this.negated;
		if (this.name === "=") {
			assert(this.args.length === 2, "equalities must have exactly two arguments");
			return this.args[0].toString(this.hideBracketsAssoc) + (occursNegated ? " != " : " = ") + this.args[1].toString(this.hideBracketsAssoc);
		}
		if (this.name === "$less" || this.name === "Sub") {
			assert(this.args.length === 2, "inequalities must have exactly two arguments");
			if(this.representation === 0) {
				return this.args[0].toString(this.hideBracketsAssoc) + (occursNegated ? (this.nonStrictForNegatedStrictInequalities ? " >= " : " !< ") : " < ") + this.args[1].toString(this.hideBracketsAssoc);
			} else {
				return this.args[1].toString(this.hideBracketsAssoc) + (occursNegated ? (this.nonStrictForNegatedStrictInequalities ? " <= " : " !> ") : " > ") + this.args[0].toString(this.hideBracketsAssoc);
			}
		}
		// could also use logical-not-symbol: "\u00AC"
		return (occursNegated ? "!" : "") + this.name + "(" + this.args.map(arg => arg.toString(this.hideBracketsAssoc)).join(",") + ")";
	}
}

export class Term {
	readonly name: string;
	readonly args: Term[];
	readonly isVariable: boolean;
	
	constructor(name: string, args: Term[]) {
		this.name = name;
		this.args = args;
		const isVariable = name.startsWith("X")
		this.isVariable = isVariable;
		if(isVariable) {
			assert(this.args.length === 0);
		}
	}

	toString(hideBracketsAssoc: boolean): string {
		let name = this.name;
		if(this.name === "$sum") {
			name = "+";
		} else if(this.name === "$uminus") {
			name = "-";
		}

		if(this.args.length === 0){
			return name;
		} else {
			if (name === "+"){
				const inner = this.args.map(arg => arg.toString(hideBracketsAssoc)).join("+");
				if (hideBracketsAssoc) {
					return inner;
				} else {
					return "(" + inner + ")";
				}
			}
			return name + "(" + this.args.map(arg => arg.toString(hideBracketsAssoc)).join(",") + ")";
		}
	}
}



