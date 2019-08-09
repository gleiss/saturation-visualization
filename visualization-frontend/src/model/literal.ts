import { assert } from "./util";

export class Literal {
	readonly name: string;
	readonly args: FunctionApplication[];
	readonly negated: boolean;

	constructor(name:string, args: FunctionApplication[], negated: boolean){
		this.name = name;
		this.args = args;
		this.negated = negated;
	}

	toString() : string {
		if (this.name === "=") {
			assert(this.args.length === 2, "equalities must have exactly two arguments");
			return this.args[0].toString() + (this.negated ? " != " : " = ") + this.args[1].toString();
		}
		if (this.name === "$less" || this.name === "Sub") {
			assert(this.args.length === 2, "inequalities must have exactly two arguments");
			return this.args[0].toString() + (this.negated ? " !< " : " < ") + this.args[1].toString();
		}
		// could also use logical-not-symbol: "\u00AC"
		return (this.negated ? "!" : "") + this.name + "(" + this.args.map(arg => arg.toString()).join(",") + ")"; 
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
		if(this.args.length === 0){
			return this.name;
		} else {
			return this.name + "(" + this.args.map(arg => arg.toString()).join(",") + ")";
		}
	}
}



