import { assert } from "./util";

export class Literal {
	readonly name: string;
	readonly args: FunctionApplication[];
	readonly negated: boolean;
	readonly isSelected: boolean;
	orientationIsConclusion: boolean;
	representation: number;

	constructor(name:string, args: FunctionApplication[], negated: boolean, isSelected: boolean){
		this.name = name;
		this.args = args;
		this.negated = negated;
		this.isSelected = isSelected;
		this.orientationIsConclusion = true; // at the beginning all clauses are in clausal orientation.
		this.representation = 0; // 0 represents standard representation. Some literals may define other representations
	}

	setOrientation(orientationIsConclusion: boolean) {
		this.orientationIsConclusion = orientationIsConclusion;
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

	toString() : string {
		const occursNegated = this.orientationIsConclusion ? this.negated : !this.negated;
		if (this.name === "=") {
			assert(this.args.length === 2, "equalities must have exactly two arguments");
			return this.args[0].toString() + (occursNegated ? " != " : " = ") + this.args[1].toString();
		}
		if (this.name === "$less" || this.name === "Sub") {
			assert(this.args.length === 2, "inequalities must have exactly two arguments");
			if(this.representation === 0) {
				return this.args[0].toString() + (occursNegated ? " !< " : " < ") + this.args[1].toString();
			} else {
				return this.args[1].toString() + (occursNegated ? " !> " : " > ") + this.args[0].toString();
			}
		}
		// could also use logical-not-symbol: "\u00AC"
		return (occursNegated ? "!" : "") + this.name + "(" + this.args.map(arg => arg.toString()).join(",") + ")"; 
	}
}

export class FunctionApplication {
	readonly name: string;
	readonly args: FunctionApplication[];

	constructor(name: string, args: FunctionApplication[]) {
		this.name = name;
		this.args = args;
	}

	toString(): string {
		let name = this.name;
		if(this.name === "$sum") {
			name = "+";
		} else if(this.name === "$uminus") {
			name = "-";
		}

		if(this.args.length === 0){
			return name;
		} else {
			const ignoreAssociativity = true;
			if(ignoreAssociativity) {
				if(name == "+"){
					return this.args.map(arg => arg.toString()).join("+");
				}
			}
			return name + "(" + this.args.map(arg => arg.toString()).join(",") + ")";
		}
	}
}



