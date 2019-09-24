import {assert} from './util'
import {Unit, Formula, Clause} from './unit'
import {Literal, Term} from './literal'

// class for parsing Units, Formulas, Clauses, Literals and Terms
export class UnitParser {

	static parsePreprocessingUnit(string: string): Unit {
		// heuristic to determine whether unit is a clause:
		// if unit only contains certain symbols, it has to be a clause
		// otherwise, treat it as a formula.
		const symbolsAllowedInClauses = /^[a-zA-Z0-9()=,~!$ |']+$/;
		let isClause = string.match(symbolsAllowedInClauses);
	
		if(isClause) {
		  return UnitParser.parseClause(string);
		} else {
		  return new Formula(string);
		}
	}

	static parseClause(string: string): Clause {
		if(string === "$false") {
			return new Clause([]); // empty clause
		}
		const literalStrings = string.split(" | ")

		const literals = new Array<Literal>();
		for (let i = 0; i < literalStrings.length; i++) {
			literals.push(UnitParser.parseLiteral(literalStrings[i]));
		}
		
		return new Clause(literals);
	}

	static parseLiteral(string: string): Literal {
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
				const lhs = UnitParser.parseTerm(lhsString);
				const rhs = UnitParser.parseTerm(rhsString);
				return new Literal("=", [lhs, rhs], true);
			}
			else
			{
				assert(string[equalityPosition - 1] === " ", `equality not surrounded by spaces in string ${string}`);
				assert(string[equalityPosition + 1] === " ", `equality not surrounded by spaces in string ${string}`);
				const lhsString = string.substring(0, equalityPosition - 1);
				const rhsString = string.substring(equalityPosition + 2, string.length);
				const lhs = UnitParser.parseTerm(lhsString);
				const rhs = UnitParser.parseTerm(rhsString);
				
				return new Literal("=", [lhs, rhs], false);
			}
		}
		else
		{
			const negated = (string[0] === "~");
			const atomString = negated ? string.substring(1) : string;

			// parse atom as term first and then convert it to literal
			const literalTerm = UnitParser.parseTerm(atomString);
			return new Literal(literalTerm.name, literalTerm.args, negated);
		}
	}

	static parseTerm(string:string): Term {
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
		let stack: Array<Array<string|Term>> = [[]];

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
				const args = stack.pop() as Array<string | Term>;
				const name = stack[stack.length - 1].pop();
				const f = new Term(name as string, args as Array<Term>);
				stack[stack.length - 1].push(f);
			}
		}

		assert(stack.length === 1, "invar violated for string: " + string);
		// assert(stack[0].length === 1, "invar violated for string:" + string + ":");
		return stack[0][0] as Term;
	}
}