import * as diff from 'diff';
export function toDiff(expr1, expr2){
    let result : {value:string, added:boolean, removed:boolean}[] = [];
    let expr1List = expr1.split("\n");
    let expr2List = expr2.split("\n");
    for (let i = 0; i < Math.min(expr1List.length, expr2List.length); i++){
        let lineDiff = diff.diffWords(expr1List[i], expr2List[i]);
        lineDiff.push({
            added: false,
            removed: false, 
            value: "\n"
        });
        result = result.concat(lineDiff);
        console.log(result);
    }
    console.log(result);
    return result;
    
} 