import {assert} from "../model/util";

export function findClosestNode(nodeId: number, direction, network){
    assert(network);
    assert("body" in network!);
    const currentNode = network!.body.nodes[nodeId];
    let closestNode = currentNode.id;
    let min_distance = Number.MAX_SAFE_INTEGER;

    if (direction === "ArrowLeft"){
        for(const idx in network!.body.nodes){
            const node = network!.body.nodes[idx];
            let distance = currentNode.x - node.x;
            if (node.y !== currentNode.y) {continue}
            if (distance > 0 && distance < min_distance){
                closestNode = node.id;
                min_distance = distance;
            }
        }
    }
    else if (direction === "ArrowRight"){
        for (let idx in network!.body.nodes){
            const node = network!.body.nodes[idx];
            let distance = node.x - currentNode.x;
            if (node.y !== currentNode.y) {continue}
            if (distance > 0 && distance < min_distance){
                closestNode = node.id;
                min_distance = distance;
            }
        }
    }
    else if (direction === "ArrowDown" && currentNode.edges.length >= 2){
        closestNode = currentNode.edges.filter(edge => edge.fromId === currentNode.id)[0].toId;
    }
    else if (direction === "ArrowUp" && currentNode.edges.length >= 1){
        let closestNodes = currentNode.edges.filter(edge => edge.toId === currentNode.id);
        if (closestNodes.length > 0){
            closestNode = closestNodes[0].fromId;
        }
    }
    return closestNode;

}
