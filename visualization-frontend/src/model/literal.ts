
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



