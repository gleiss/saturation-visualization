import {assert} from './util'
import {Unit, Formula, Clause} from './unit'
import {Literal, FunctionApplication} from './literal'

// class for parsing Units, Formulas, Clauses, Literals and FunctionApplications
export class UnitParser {

	static parseUnit(string: string, isFromPreprocessing: boolean, statistics: Map<string,number>): Unit {
		// heuristic to determine whether unit is a clause:
		// if unit is not from preprocessing, it has to be a clause
		// if unit only contains certain symbols, it has to be a clause
		// otherwise, treat it as a formula.
		const symbolsAllowedInClauses = /^[a-zA-Z0-9()=,~!$ |']+$/;
		let isClause = (!isFromPreprocessing) || string.match(symbolsAllowedInClauses);
	
		if(isClause) {
		  const nSel = statistics.get("nSel");
		  return UnitParser.parseClause(string, (nSel !== undefined ? nSel : null));
		}
		else {
		  return new Formula(string);
		}
	}

	static parseClause(string: string, numberOfSelectedLiterals: number | null): Clause {
		if(string === "$false") {
			assert(numberOfSelectedLiterals === null);
			return new Clause([], []); // empty clause
		}
		const literalStrings = string.split(" | ")

		const literals = new Array<Literal>();
		for (let i = 0; i < literalStrings.length; i++) {
			const isSelected = (numberOfSelectedLiterals !== null) && i < numberOfSelectedLiterals;
			literals.push(UnitParser.parseLiteral(literalStrings[i], isSelected));
		}
		
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
			return new Clause(premiseLiterals, conclusionLiterals);
		} else {
			return new Clause([], literals);
		}
	}

	static parseLiteral(string: string, isSelected: boolean): Literal {
		// need to handle equality separately, since it is written in infix-notation
		// all other predicates are written in prefix-notation
		const equalityPosition = string.search("=");
		if(equalityPosition !== -1)
		{
			if(string[equalityPosition - 1] === "!") {
				assert(string[equalityPosition - 2] === " ", `negated equality not surrounded by spaces in string ${string}`);
				assert(string[equalityPosition + 1] === " ", `negated equality not surrounded by spaces in string ${string}`);
				const lhsString = string.substring(0, equalityPosition - 2);
				const rhsString = string.substring(equalityPosition + 2, string.length);
				const lhs = UnitParser.parseFunctionApplication(lhsString);
				const rhs = UnitParser.parseFunctionApplication(rhsString);
				return new Literal("=", [lhs, rhs], true, isSelected);
			}
			else
			{
				assert(string[equalityPosition - 1] === " ", `equality not surrounded by spaces in string ${string}`);
				assert(string[equalityPosition + 1] === " ", `equality not surrounded by spaces in string ${string}`);
				const lhsString = string.substring(0, equalityPosition - 1);
				const rhsString = string.substring(equalityPosition + 2, string.length);
				const lhs = UnitParser.parseFunctionApplication(lhsString);
				const rhs = UnitParser.parseFunctionApplication(rhsString);
				
				return new Literal("=", [lhs, rhs], false, isSelected);
			}
		}
		else
		{
			const negated = (string[0] === "~");
			const atomString = negated ? string.substring(1) : string;

			// parse atom as term first and then convert it to literal
			const literalTerm = UnitParser.parseFunctionApplication(atomString);
			return new Literal(literalTerm.name, literalTerm.args, negated, isSelected);
		}
	}

	static parseFunctionApplication(string:string): FunctionApplication {
		// Part 1: lex tokens
		let tokens: string[] = [];
		let stringPos = 0;
		while(stringPos < string.length) {
			const char = string[stringPos];
			
			if (char === "(" || char === ")" || char === ",") {
				tokens.push(char);
				stringPos = stringPos + 1;
			} else {
				let tokenEnd = stringPos;
				while(tokenEnd < string.length 
					&& string[tokenEnd] !== "(" 
					&& string[tokenEnd] !== ")" 
					&& string[tokenEnd] !== ",") {
					tokenEnd = tokenEnd + 1;
				}
				tokens.push(string.substring(stringPos,tokenEnd));
				stringPos = tokenEnd;
			}
		}

		// Part 2: add brackets after each string token which is not succeeded by brackets (that is, for each constant)
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if(token !== "(" && token !== ")" && token !== ","){
				if(i+1 === tokens.length || tokens[i+1] !== "(") {
					tokens.splice(i+1,0,"(");
					tokens.splice(i+2,0,")");
				}
			}	
		}

		// Part 3: parse token array
		let stack: Array<Array<string|FunctionApplication>> = [[]];

		for (let pos = 0; pos < tokens.length; pos++) {
			const token = tokens[pos];

			if(token !== "(" && token !== ")" && token !== ",")
			{
				stack[stack.length - 1].push(token);
			} 
			else if (token === "(") 
			{
				stack.push([]);
			}
			else if (token === ")") 
			{
				const args = stack.pop() as Array<string | FunctionApplication>;
				const name = stack[stack.length - 1].pop();
				const f = new FunctionApplication(name as string, args as Array<FunctionApplication>);
				stack[stack.length - 1].push(f);
			}
		}

		assert(stack.length === 1, "invar violated for string: " + string);
		// assert(stack[0].length === 1, "invar violated for string:" + string + ":");
		return stack[0][0] as FunctionApplication;
	}
}