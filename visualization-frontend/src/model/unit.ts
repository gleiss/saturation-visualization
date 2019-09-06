import {assert} from './util'
import {Literal} from './literal'

// a unit is either a Formula or a clause.
// units are also used internally by Vampire.
// we fully parse clauses, but we keep formulas as string.
// fully parsing formulas is more involved, in particular if one wants to support a reasonably complete subset of tptp.
export type Unit = Formula | Clause;

export class Formula {
  readonly type: "Formula" | "Clause";
  readonly formula: string;
  
  constructor(formula: string) {
    this.type = "Formula";
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
  readonly type: "Formula" | "Clause";
  readonly literals: Literal[];
  readonly numberOfSelectedLiterals: number | null;

  constructor(literals: Literal[], numberOfSelectedLiterals: number | null){
    this.type = "Clause";
    this.literals = literals;
    this.numberOfSelectedLiterals = numberOfSelectedLiterals;
  }

  toString(): string {
    if (this.literals.length === 0) {
      return "$false"; // empty clause
    }
    return this.literals.map(literal => literal.toString()).join(" | ");
  }

  toHTMLString(): string {
    if (this.literals.length === 0) {
      return "$false"; // empty clause
    }
    const premiseString = this.literals
      .filter(literal => !literal.orientationIsConclusion)
      .map(literal => literal.isSelected ? ("<b>" + literal.toString() + "</b>") : literal.toString())
      .join(" & ");

    let conclusionString = this.literals
      .filter(literal => literal.orientationIsConclusion)
      .map(literal => literal.isSelected ? ("<b>" + literal.toString() + "</b>") : literal.toString())
      .join(" | ");

    if(conclusionString === "") {
      conclusionString = "$false";
    }
    if (premiseString === "") {
      return conclusionString;
    } else {
      // simple heuristic to estimate the length of the separating line between premise and conclusion.
      const premiseStringWithoutBoldness = this.literals
        .filter(literal => !literal.orientationIsConclusion)
        .map(literal => literal.toString())
        .join(" & ");
      const conclusionStringWithoutBoldness = this.literals
        .filter(literal => literal.orientationIsConclusion)
        .map(literal => literal.toString())
        .join(" | ");
      const estimatedLengthOfLine = Math.ceil(Math.max(premiseStringWithoutBoldness.length, conclusionStringWithoutBoldness.length) * 0.8);
      const string = premiseString + "\n" + "\u2013".repeat(estimatedLengthOfLine) + "\n" + conclusionString;
      return string;
    }
  }
}