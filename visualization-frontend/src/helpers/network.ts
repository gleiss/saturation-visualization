const styleTemplates = require('../resources/styleTemplates');

export const lemmaColours = [
    "#e6194B",
    "#f58231",
    "#3cb44b",
    "#42d4f4",
    "#000075",
    "#469990",
    "#911eb4",
    "#f032e6",
    "#fabebe",
    "#800000",
];

//BUILD POB LEMMAS MAP////////////////////
export function buildPobLemmasMap(tree: any): any{
    // construct exprID->expr map
    let ExprMap = new Map<number, string>();
    for (const nodeID in tree) {
        const node = tree[nodeID];
        ExprMap[node.exprID] = node.expr;
    }

    // construct PobExprID->a list of lemmas
    let PobLemmasMap = {};
    for (const nodeID in tree) {
        let node = tree[nodeID];
        if (node.event_type !== "EType.ADD_LEM") {
            continue
        }
        const lemmaExprID = node.exprID;
        const level = node.level;
        const pobID = node.pobID;
        if (!(pobID in PobLemmasMap)) {
            PobLemmasMap[pobID] = new Array<{}>();
        }

        //traverse the list, if lemmaExprID is already in the list, update its min max
        let existPrevLemma = false;
        for (const lemma of PobLemmasMap[pobID]) {
            if (lemma[0] === lemmaExprID) {
                existPrevLemma = true;
                let prev_min = lemma[1];
                let prev_max = lemma[2];

                if (level > prev_max || level === "oo") {
                    lemma[2] = level
                }
                if (level < prev_min) {
                    lemma[1] = level
                }
                break
            }
        }

        if (!existPrevLemma) {
            PobLemmasMap[node.pobID].push([lemmaExprID, level, level])
        }
    }
    return PobLemmasMap
}


//BUILD EXPR MAP////////////////////////
export function buildExprMap(tree: any): any{
    let ExprMap = new Map<number, string>();
    for (const nodeID in tree) {
        const node = tree[nodeID];
        ExprMap[node.exprID] = node.expr;
    }
    return ExprMap

}


export function PobVisLayout(tree): any{
    let treeCloned = JSON.parse(JSON.stringify(tree));

    for (const nodeID in treeCloned){
        let node = treeCloned[nodeID];
        if(node.event_type !== "EType.EXP_POB"){
            node.to_be_vis = false;
            continue
        }

        let parent = treeCloned[node.parent];
        let siblings = parent.children;
        let same_as_sibl = false;
        let identical_sibl;
        for(const siblID of siblings){

            const sibl = treeCloned[siblID];
            if(sibl.nodeID !== node.nodeID && sibl.exprID === node.exprID){
                same_as_sibl = true;
                identical_sibl = sibl;
                break
            }

        }
        if(same_as_sibl){
            // I will disappear
            node.to_be_vis = false;

            // point all my children to my sibling
            for(const childID of node.children){
                treeCloned[childID].parent = identical_sibl.nodeID;
                identical_sibl.children.push(childID)
            }
            //change my parent's children
            let new_children = new Array<number>();
            for (const childID of siblings){
                if(childID !== node.nodeID){
                    new_children.push(childID)
                }
            }
            parent.children = new_children
        }
    }

    return treeCloned
}

export function toVisNode(node: any, style: string, nodeSelection, color:number = -1): any {
    const styleData = styleTemplates[style];
    const isMarked = nodeSelection.includes(node.nodeID);

    let finalColor  = {
        border : isMarked ? styleData.markedStyle.border : styleData.defaultStyle.border,
            background : isMarked ? styleData.markedStyle.background : styleData.defaultStyle.background,
            highlight : {
            border : styleData.highlightStyle.border,
                background : styleData.highlightStyle.background
        }
    };
    
    if (style === "lemma" && color !== -1) {
        finalColor = {
            border: lemmaColours[color],
            background: lemmaColours[color],
            highlight: {
                border: lemmaColours[color],
                background: lemmaColours[color]
            }
        }
    }
    return {
        id: node.nodeID,
        shape: styleData.shape,
        fixed: true,
        color: finalColor
    };
}


export function toVisEdge(edgeId: number, parentNodeId: number, nodeID: number, hidden: boolean) {
    return {
        id: edgeId,
        arrows: "to",
        color: {
            color: "#dddddd",
            highlight: "#f8cfc1",
        },
        from: parentNodeId,
        to: nodeID,
        smooth: false,
        hidden: hidden
    }
}

export function getSliderValue(slider): number {
    return slider.current ? parseInt(slider.current.value, 10) : 0;
}
