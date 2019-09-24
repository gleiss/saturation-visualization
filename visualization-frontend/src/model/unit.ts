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

  toHTMLString(isActive: boolean): string {
    return this.formula;
  }
}

export class Clause {
  readonly type: "Formula" | "Clause";
  premiseLiterals: Literal[];
  conclusionLiterals: Literal[];

  constructor(conclusionLiterals: Array<Literal>){
    this.type = "Clause";
    this.premiseLiterals = [];
    this.conclusionLiterals = conclusionLiterals;
  }

  changeLiteralOrientation(oldPosition: [boolean, number], newPosition: [boolean, number]) {

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
  }

  toString(): string {
    if (this.premiseLiterals.length === 0 && this.conclusionLiterals.length === 0) {
      return "$false"; // empty clause
    }
    const literals = this.premiseLiterals.concat(this.conclusionLiterals);
    return literals.map(literal => literal.toString(true)).join(" | ");
  }

  toHTMLString(isActive: boolean): string {
    const premiseString = this.premiseLiterals
      .map(literal => literal.isSelected ? ("<b>" + literal.toString(false) + "</b>") : literal.toString(false))
      .join(" & ");

    let conclusionString = this.conclusionLiterals
      .map(literal => literal.isSelected ? ("<b>" + literal.toString(true) + "</b>") : literal.toString(true))
      .join(" | ");
    const premiseStringWithoutBoldness = this.premiseLiterals
      .map(literal => literal.toString(false))
      .join(" & ");
    let conclusionStringWithoutBoldness = this.conclusionLiterals
      .map(literal => literal.toString(true))
      .join(" | ");
    if(this.conclusionLiterals.length === 0) {
      conclusionString = "$false";
      conclusionStringWithoutBoldness = "$false";
    }

    if (this.premiseLiterals.length === 0) {
      if (isActive) {
        return conclusionString;
      } else {
        return conclusionStringWithoutBoldness;
      }
    } else {
      // simple heuristic to estimate the length of the separating line between premise and conclusion.
      const estimatedLengthOfLine = Math.ceil(Math.max(premiseStringWithoutBoldness.length, conclusionStringWithoutBoldness.length) * 0.8);

      if (isActive) {
        return premiseString + "\n" + "\u2013".repeat(estimatedLengthOfLine) + "\n" + conclusionString;
      } else {
        return premiseStringWithoutBoldness + "\n" + "\u2013".repeat(estimatedLengthOfLine) + "\n" + conclusionStringWithoutBoldness;
      }
    }
  }
}