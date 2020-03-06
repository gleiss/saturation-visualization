import {parse} from "s-exify";

export function toReadable(expr, varList) {
    if (expr[0] !== "("){
        expr = "(" + expr + ")";
    }
    let reorderResult = parseResult(parse(expr), "");
    if (varList.length === 0 ){
        return reorderResult;
    }
    return replaceVarNames(reorderResult, varList);
}

function parseResult(lst, sep) {
    //symbols for logical relations
    let logSym = {
        "and": "&&",
        "or": "||"
    };

    //symbols for mathematical operations
    //Note: "-" is not included because negative numbers are in the form (- x)
    let logOp = ["=", "<=", ">=", ">", "<", "+", "*", "/"];

    //empty list should return empty string
    if (lst.length < 1){
        return "";
    }

    //logical symbol should be inserted between each child clause
    if (lst[0] in logSym) {
        return parseResult(lst.splice(1), logSym[lst[0]]);
    }

    //reorders to put operators between operands
    //Note: accounts for "-" denoting the subtraction of 2 numbers, (- x y)
    if (logOp.indexOf(lst[0]) >= 0 || (lst[0] === "-" && lst.length === 3)){
        return "(" + parseResult(lst[1], "") + " " + lst[0] + " " + parseResult(lst[2], "") + ")";
    }

    //handles indexing into an array
    if (lst[0] === "select") {
        return lst[1] + "[" + lst[2] + "]";
    }

    //Adds not symbol (!) to beginning of clause
    if (lst[0] === "not"){
        return "!" + parseResult(lst[1], "");
    }

    //prevents trailing logical symbol
    if (sep !== "" && lst.length === 1){
        return parseResult(lst[0], "");
    }

    //actual place where logical symbol gets placed between clauses
    if (sep !== "") {
        return parseResult(lst[0], "") + " " + sep + "\n" + parseResult(lst.splice(1), sep);
    }

    //handler for negative numbers which come in the form (- x)
    if (lst[0] === "-"){
        return lst[0] + lst[1];
    }

    //handler for denoting invariants. Ex. Inv (...)
    if (typeof(lst[0]) === 'string' && Array.isArray(lst) && lst.length > 1){
        return lst[0] + ": (" + parseResult(lst[1], "") + ")";
    }

    return lst;
}

function replaceVarNames(expr, varList) {
    if (typeof expr === "string") {
        let newList = varList.split(",");
        for (let i = 0; i < newList.length; i++) {
            let regex = new RegExp("Inv_" + i + "_n", "gi");
            expr = expr.replace(regex, newList[i]);
        }
    }
    return expr;
}

