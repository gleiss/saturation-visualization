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
  contextLiterals: Literal[];
  
  // in order to compute literal flows we need to save the order in which literals occured in the clause
  // at the timepoints of the new-event and the active-event
  // the referenced literals are not only equal, but the same as the literals in premiseLiterals and conclusionLiterals
  literalsNewEvent: Literal[] | null;
  literalsActiveEvent: Literal[] | null;

  constructor(conclusionLiterals: Array<Literal>){
    this.type = "Clause";
    this.premiseLiterals = [];
    this.conclusionLiterals = conclusionLiterals;
    this.contextLiterals = [];
    this.literalsNewEvent = null;
    this.literalsActiveEvent = null;
  }

  changeLiteralOrientation(oldPosition: ["premise" | "conclusion" | "context", number], newPosition: ["premise" | "conclusion" | "context", number]) {

    // remove literal from old position
    let removedLiterals: Array<Literal> | null = null;
    if (oldPosition[0] === "premise") {
      assert(0 <= oldPosition[1]);
      assert(oldPosition[1] < this.premiseLiterals.length);
      removedLiterals = this.premiseLiterals.splice(oldPosition[1], 1);
    } else if (oldPosition[0] === "conclusion"){
      assert(0 <= oldPosition[1]);
      assert(oldPosition[1] < this.conclusionLiterals.length);
      removedLiterals = this.conclusionLiterals.splice(oldPosition[1], 1);
    } else {
      assert(0 <= oldPosition[1]);
      assert(oldPosition[1] < this.contextLiterals.length);
      removedLiterals = this.contextLiterals.splice(oldPosition[1], 1);
    }
    assert(removedLiterals.length === 1);
    const removedLiteral = removedLiterals[0];

    // add literal to new position
    if (newPosition[0] === "premise") {
      assert(0 <= newPosition[1]);
      assert(newPosition[1] <= this.premiseLiterals.length);
      this.premiseLiterals.splice(newPosition[1], 0, removedLiteral);
    } else if (newPosition[0] === "conclusion") {
      assert(0 <= newPosition[1]);
      assert(newPosition[1] <= this.conclusionLiterals.length);
      this.conclusionLiterals.splice(newPosition[1], 0, removedLiteral);
    } else {
      assert(0 <= newPosition[1]);
      assert(newPosition[1] <= this.contextLiterals.length);
      this.contextLiterals.splice(newPosition[1], 0, removedLiteral);
    }
    removedLiteral.orientationReason = "user";
  }

  toString(): string {
    if (this.premiseLiterals.length === 0 && this.conclusionLiterals.length === 0 && this.contextLiterals.length === 0) {
      return "$false"; // empty clause
    }
    const literals = this.premiseLiterals.concat(this.conclusionLiterals, this.contextLiterals);
    return literals.map(literal => literal.toString(false)).join(" | ");
  }

  toHTMLString(isActive: boolean): string {
    let premiseString = this.premiseLiterals
      .map(literal => literal.isSelected ? ("<b>" + literal.toString(true) + "</b>") : literal.toString(true))
      .join(" & ");
    let conclusionString = this.conclusionLiterals
      .map(literal => literal.isSelected ? ("<b>" + literal.toString(false) + "</b>") : literal.toString(false))
      .join(" | ");
    let contextString = this.contextLiterals
      .map(literal => literal.isSelected ? ("<b>" + literal.toString(false) + "</b>") : literal.toString(false))
      .join(" | ");
    let premiseStringWithoutBoldness = this.premiseLiterals
      .map(literal => literal.toString(true))
      .join(" & ");
    let conclusionStringWithoutBoldness = this.conclusionLiterals
      .map(literal => literal.toString(false))
      .join(" | ");
    let contextStringWithoutBoldness = this.contextLiterals
      .map(literal => literal.toString(false))
      .join(" | ");
    if(this.conclusionLiterals.length === 0) {
      conclusionString = "$false";
      conclusionStringWithoutBoldness = "$false";
    }

    // simple heuristic to estimate the length of the separating line between premise and conclusion.
    const estimatedLengthOfLine = Math.ceil(Math.max(premiseStringWithoutBoldness.length, conclusionStringWithoutBoldness.length, contextStringWithoutBoldness.length) * 0.8);
    const line = "\u2013".repeat(estimatedLengthOfLine);

    // don't use bold strings if clause is not activated yet
    if (!isActive) {
      premiseString = premiseStringWithoutBoldness;
      conclusionString = conclusionStringWithoutBoldness;
      contextString = contextStringWithoutBoldness;
    }

    const implication = this.premiseLiterals.length === 0 ? conclusionString : (premiseString + "\n\u2192\n" + conclusionString);

    return this.contextLiterals.length === 0 ? implication : (implication + "\n" + line + "\n" + contextString);
  }
}