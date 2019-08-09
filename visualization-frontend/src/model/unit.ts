import {assert} from './util'
import {Literal} from './literal'

// a unit is either a Formula or a clause.
// units are also used internally by Vampire.
// we fully parse clauses, but we keep formulas as string.
// fully parsing formulas is more involved, in particular if one wants to support a reasonably complete subset of tptp.
export type Unit = Formula | Clause;

export class Formula {
  readonly formula: string;
  
  constructor(formula: string) {
    this.formula = formula;
  }

  toString(): string {
    return this.formula;
  }

  toHTMLString(): string {
    return this.formula;
  }
}

export class Clause {
  readonly literals: Literal[];
  readonly numberOfSelectedLiterals: number | null;
  
  constructor(literals: Literal[], numberOfSelectedLiterals: number | null){
    this.literals = literals;
    this.numberOfSelectedLiterals = numberOfSelectedLiterals;
  }

  toString(): string {
    return this.literals.map(literal => literal.toString()).join(" | ");
  }

  toHTMLString(): string {
    if(this.numberOfSelectedLiterals === null) {
      // if the node does not contain information about the number of selected literals,
      // use no formatting
      return this.toString();
    } else {
      // otherwise construct a string which formats all selected literals bold.
      let string;
      assert(this.numberOfSelectedLiterals >= 1, "nSel must be greater or equal 1");
      assert(this.numberOfSelectedLiterals <= this.literals.length, "nSel can't be greater than number of literals");

      string = "<b>" + this.literals[0];
      for (let i = 1; i < this.numberOfSelectedLiterals; i++) {
        string = string.concat(" | " + this.literals[i]);
      }
      string = string.concat("</b>")
      for (let i = this.numberOfSelectedLiterals; i < this.literals.length; i++) {
        string = string.concat(" | " + this.literals[i]);
      }
      return string;
    }
  }
}