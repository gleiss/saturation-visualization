import * as React from 'react';
import { DataSet, Network, IdType, Node, Edge } from 'vis'

import '../styles/Graph.css'
import { assert } from '../model/util';
import {PobVisLayout, toVisEdge, toVisNode} from "../helpers/network";
import {findClosestNode} from "../helpers/navigation";

tconst styleTemplates = require('../resources/styleTemplates');

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
            this.visLayout(this.props.tree, onlyUpdateStyles);
        }else if(layout=="PobVis"){
            console.time('pobvislayout');
            const PobVisTree =  this.PobVisLayout()
            console.timeEnd('pobvislayout');
            this.visLayout(PobVisTree, onlyUpdateStyles);
        }

    }

    visLayout(ATree, onlyUpdateStyles){
        console.time('my code')
        let find_related_nodes = this.props.nodeSelection.length>0
        let currentNodeExprID = -100
        if(find_related_nodes){
            currentNodeExprID = ATree[this.props.nodeSelection[0]].exprID
        }
        const visNodes = new Array<Node>();
        const visEdges = new Array<Edge>();
        let edgeId = 0


        for (const nodeID in ATree){
            let node = ATree[nodeID]
            if(!node.to_be_vis) continue
            let visNode;
            //Prioritize related nodes
            if (node.exprID == currentNodeExprID){
                visNode = toVisNode(node, "sameExprID")
            }else{
                if(node.nodeID > this.props.currentTime){
                    visNode = toVisNode(node, "activated");
                }
                else{
                    visNode = toVisNode(node, "passive");
                }
            }

            visNodes.push(visNode);
            const visEdge = toVisEdge(edgeId, node.parent, node.nodeID, false);
            visEdges.push(visEdge);
            edgeId++;
        }
        console.timeEnd('my code');
        if(onlyUpdateStyles){
            console.time('updating edge and node');
            this.networkNodes.update(visNodes);
            this.networkEdges.update(visEdges);
            console.timeEnd('updating edge and node');
        }else{
            console.time('adding edge and node');
            this.networkNodes.clear();
            this.networkNodes.add(visNodes);
            this.networkEdges.clear();
            this.networkEdges.add(visEdges);

            console.timeEnd('adding edge and node');           
        }

    }

    keydownHandler(event) {
    }
    keyupHandler(event) {
        if(this.props.nodeSelection.length==0) return
        const selected_node = this.props.nodeSelection[0]
        let closest_node = selected_node
        if(event.key=="ArrowLeft"){
            closest_node = findClosestNode(selected_node, "l")
        }
        if(event.key=="ArrowRight"){
            closest_node = findClosestNode(selected_node, "r")
        }
        this.props.onNodeSelectionChange([closest_node]);
    }
}
