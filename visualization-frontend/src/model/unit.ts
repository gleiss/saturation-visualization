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
  premiseLiterals: Literal[];
  conclusionLiterals: Literal[];

  constructor(premiseLiterals: Array<Literal>, conclusionLiterals: Array<Literal>){
    this.type = "Clause";
    this.premiseLiterals = premiseLiterals;
    this.conclusionLiterals = conclusionLiterals;
  }

  changeLiteralOrientation(oldPosition: [boolean, number], newPosition: [boolean, number]) {
    console.log(oldPosition);
    console.log(newPosition);
    // remove literal from old position
    let removedLiterals: Array<Literal> | null = null;
    if (oldPosition[0]) {
      assert(0 <= oldPosition[1]);
      assert(oldPosition[1] < this.conclusionLiterals.length);
      removedLiterals = this.conclusionLiterals.splice(oldPosition[1], 1);
      assert(removedLiterals.length === 1);
    } else {
      assert(0 <= oldPosition[1]);
      assert(oldPosition[1] < this.premiseLiterals.length);
      removedLiterals = this.premiseLiterals.splice(oldPosition[1], 1);
      assert(removedLiterals.length === 1);
    }
    // add literal to new position
    if (newPosition[0]) {
      assert(0 <= newPosition[1]);
      assert(newPosition[1] <= this.conclusionLiterals.length);
      this.conclusionLiterals.splice(newPosition[1], 0, removedLiterals[0]);
    } else {
      assert(0 <= newPosition[1]);
      assert(newPosition[1] <= this.premiseLiterals.length);
      this.premiseLiterals.splice(newPosition[1], 0, removedLiterals[0]);
    }

    console.log("premise:");
    for (const literal of this.premiseLiterals) {
      console.log(literal.toString(false));
    }

    console.log("conclusion:");
    for (const literal of this.conclusionLiterals) {
      console.log(literal.toString(true));
    }
  }

  toString(): string {
    if (this.premiseLiterals.length === 0 && this.conclusionLiterals.length === 0) {
      return "$false"; // empty clause
    }
    const literals = this.premiseLiterals.concat(this.conclusionLiterals);
    return literals.map(literal => literal.toString(true)).join(" | ");
  }

  toHTMLString(): string {
    const premiseString = this.premiseLiterals
      .map(literal => literal.isSelected ? ("<b>" + literal.toString(false) + "</b>") : literal.toString(false))
      .join(" & ");

    let conclusionString = this.conclusionLiterals
      .map(literal => literal.isSelected ? ("<b>" + literal.toString(true) + "</b>") : literal.toString(true))
      .join(" | ");

    if(this.conclusionLiterals.length === 0) {
      conclusionString = "$false";
    }
    if (this.premiseLiterals.length === 0) {
      return conclusionString;
    } else {
      // simple heuristic to estimate the length of the separating line between premise and conclusion.
      const premiseStringWithoutBoldness = this.premiseLiterals
        .map(literal => literal.toString(false))
        .join(" & ");
      const conclusionStringWithoutBoldness = this.conclusionLiterals
        .map(literal => literal.toString(true))
        .join(" | ");
      const estimatedLengthOfLine = Math.ceil(Math.max(premiseStringWithoutBoldness.length, conclusionStringWithoutBoldness.length) * 0.8);
      const string = premiseString + "\n" + "\u2013".repeat(estimatedLengthOfLine) + "\n" + conclusionString;
      return string;
    }
  }
}