import * as React from 'react';
import { DataSet, Network, IdType, Node, Edge } from 'vis'

import './Graph.css'
import { assert } from '../model/util';

import { Dag } from '../model/dag';
import SatNode from '../model/sat-node';

const styleTemplates = require('../resources/styleTemplates');

type Props = {
    tree: any,
    onNodeSelectionChange: (selection: number[]) => void,
    nodeSelection: number[],
    currentTime: number,
    layout: string,
    PobLemmasMap: any,
};

type State = {
    metaPressed: boolean,
}

export default class Graph extends React.Component<Props, {}> {

    state: State = {
        metaPressed: false,
    }

    markers = new Set<number>();
    network: Network | null = null;
    networkNodes = new DataSet<Node>([]);
    networkEdges = new DataSet<Edge>([]);
    graphContainer = React.createRef<HTMLDivElement>();
    boundKeydownHandler = this.keydownHandler.bind(this);
    boundKeyupHandler =  this.keyupHandler.bind(this);
    X_ordered_nodes = [];
    Y_ordered_nodes = [];
   
    componentDidMount() {
        this.generateNetwork();
        this.updateNetwork(false, this.props.layout);
        this.network!.fit();
        window.addEventListener("keydown", this.boundKeydownHandler, false);
        window.addEventListener("keyup", this.boundKeyupHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.boundKeydownHandler, false);
        window.removeEventListener("keyup", this.boundKeyupHandler, false);
    }

    componentDidUpdate(prevProps: Props) {
        this.updateNetwork(false, this.props.layout);
    }

    render() {
        return (
            <section className= "component-graph" ref = { this.graphContainer } >
                <canvas/>
                </section>
    );
    }

    handleKeyPress(event) {
        console.log(event.key)
        if(event.key === 'Enter'){
            console.log('enter press here! ')
        }
    }
    // DISPLAY NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    generateNetwork() {
        console.log("I am Graph. I receive:", this.props)
        assert(this.graphContainer.current);
        assert(!this.network); // should only be called once

        this.network = new Network(this.graphContainer.current!, {
            nodes: this.networkNodes,
            edges: this.networkEdges
        }, {
            physics: false,
            interaction: {
                multiselect: false
            },layout: {
                hierarchical: {
                    direction: 'UD',
                    sortMethod: 'directed',
                },
            }

        });

        this.network.on('click', async (clickEvent) => {
            if (clickEvent.nodes.length > 0) {

                assert(clickEvent.nodes.length === 1);
                const clickedNodeId = clickEvent.nodes[0];
                console.log("clickEvent.nodes", clickEvent.nodes)
                console.log("clickedNodeId", this.props.tree[clickedNodeId])
                this.props.onNodeSelectionChange(clickEvent.nodes);
            } else {
                this.props.onNodeSelectionChange([]);
            }
        });

    }


    // updates the network displayed by Vis.js
    updateNetwork(onlyUpdateStyles: boolean, layout: string) {
        console.log("call Update Network")
        if(layout=="SatVis"){
            this.visLayout(this.props.tree);
        }else if(layout=="PobVis"){
            const PobVisTree =  this.PobVisLayout()
            this.visLayout(PobVisTree);
        }

    }

    PobVisLayout(): any{
        let treeCloned = JSON.parse(JSON.stringify(this.props.tree)); 
        let find_related_nodes = this.props.nodeSelection.length>0
        let currentNodeExprID = -100
        if(find_related_nodes){
            currentNodeExprID = treeCloned[this.props.nodeSelection[0]].exprID
        }
        console.log("currentNodeExprID:", currentNodeExprID)

        for (const nodeID in treeCloned){
            let node = treeCloned[nodeID]
            if(node.event_type!="EType.EXP_POB"){
                node.to_be_vis = false
                continue
            }

            let parent = treeCloned[node.parent]
            let siblings = parent.children
            let same_as_sibl = false
            let identical_sibl
            for(const siblID of siblings){

                const sibl = treeCloned[siblID]
                if(sibl.nodeID!=node.nodeID && sibl.exprID == node.exprID){
                    same_as_sibl = true
                    identical_sibl = sibl
                    break
                }

            }
            if(same_as_sibl){
                // I will disappear
                node.to_be_vis = false

                // point all my children to my sibling
                for(const childID of node.children){
                    // console.log("b4", treeCloned[childID].parent)
                    treeCloned[childID].parent = identical_sibl.nodeID
                    // console.log("after", treeCloned[childID].parent)
                    identical_sibl.children.push(childID)
                }
                //change my parent's children
                let new_children = new Array<number>();
                for (const childID of siblings){
                    if(childID != node.nodeID){
                        new_children.push(childID)
                    }
                }
                parent.children = new_children
            }
        }

        return treeCloned
    }


    visLayout(ATree){
        let find_related_nodes = this.props.nodeSelection.length>0
        let currentNodeExprID = -100
        if(find_related_nodes){
            currentNodeExprID = ATree[this.props.nodeSelection[0]].exprID
        }
        console.log("currentNodeExprID:", currentNodeExprID)
        const visNodes = new Array<Node>();
        const visEdges = new Array<Edge>();
        let edgeId = 0


        for (const nodeID in ATree){
            let node = ATree[nodeID]
            if(!node.to_be_vis) continue
            let visNode;
            //Prioritize related nodes
            if (node.exprID == currentNodeExprID){
                visNode = this.toVisNode(node, "sameExprID")
            }else{
                if(node.nodeID > this.props.currentTime){
                    visNode = this.toVisNode(node, "activated");
                }
                else{
                    visNode = this.toVisNode(node, "passive");
                }
            }

            visNodes.push(visNode);
            const visEdge = this.toVisEdge(edgeId, node.parent, node.nodeID, false);
            visEdges.push(visEdge);
            edgeId++;
        }


        this.networkNodes.clear();
        this.networkNodes.add(visNodes);
        this.networkEdges.clear();
        this.networkEdges.add(visEdges);

    }

    toVisNode(node: any, style: string ): any {
        const styleData = styleTemplates[style];
        const isMarked = this.props.nodeSelection.includes(node.nodeID);
        return {
            id: node.nodeID,
            labelHighlightBold: false,
            shape: "box",
            color : {
                border : isMarked ? styleData.markedStyle.border : styleData.defaultStyle.border,
                background : isMarked ? styleData.markedStyle.background : styleData.defaultStyle.background,
                highlight : {
                    border : styleData.highlightStyle.border,
                    background : styleData.highlightStyle.background
                }
            },
        };

    }

    toVisEdge(edgeId: number, parentNodeId: number, nodeID: number, hidden: boolean) {
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

    findClosestNode(nodeId: number, direction: "u"|"d"|"l"|"r"){
        assert(this.network) 
        assert("body" in this.network!)
        const currentNode = this.network!["body"]["nodes"][nodeId]
        let closestNode = currentNode
        let min_distance = 99999

        if(direction=="l"){
            for(const idx in this.network!["body"]["nodes"]){
                const node = this.network!["body"]["nodes"][idx]
                if (node["y"]!=currentNode["y"]) {continue}
                if (currentNode["x"] <= node["x"]) {continue} // node is on the right of the selection
                if( currentNode["x"] - node["x"] < min_distance){
                    closestNode = node
                    min_distance = currentNode["x"] - node["x"]
                }
            }
            return closestNode.id

        }
        if(direction=="r"){
            for(const idx in this.network!["body"]["nodes"]){
                const node = this.network!["body"]["nodes"][idx]
                if (node["y"]!=currentNode["y"]) {continue}
                if (node["x"] <= currentNode["x"]) {continue} // node is on the left of the selection
                if( node["x"] - currentNode["x"] < min_distance){
                    closestNode = node
                    min_distance = node["x"] - currentNode["x"]
                }
            }
            return closestNode.id

        } 
        return -1

    }


    keydownHandler(event) {
    }
    keyupHandler(event) {
        if(this.props.nodeSelection.length==0) return
        const selected_node = this.props.nodeSelection[0]
        let closest_node = selected_node
        if(event.key=="ArrowLeft"){
            closest_node = this.findClosestNode(selected_node, "l")
        }
        if(event.key=="ArrowRight"){
            closest_node = this.findClosestNode(selected_node, "r")
        }
        this.props.onNodeSelectionChange([closest_node]);
    }
}
