import * as React from 'react';
import { DataSet, Network, Node, Edge } from 'vis'

import '../styles/Graph.css'
import { assert } from '../model/util';
import {PobVisLayout, toVisEdge, toVisNode} from "../helpers/network";
import {findClosestNode} from "../helpers/navigation";


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
};

export default class Graph extends React.Component<Props, {}> {

    state: State = {
        metaPressed: false,
    }

    network: Network | null = null;
    networkNodes = new DataSet<Node>([]);
    networkEdges = new DataSet<Edge>([]);
    graphContainer = React.createRef<HTMLDivElement>();
    boundKeyupHandler =  this.keyupHandler.bind(this);
   
    componentDidMount() {
        this.generateNetwork();
        this.updateNetwork(false, this.props.layout);
        this.network!.fit();
        window.addEventListener("keyup", this.boundKeyupHandler, false);
    }

    componentWillUnmount() {
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
        if (layout === "SatVis"){
            this.visLayout(this.props.tree);
        } else if(layout === "PobVis"){
            const PobVisTree =  PobVisLayout(this.props.tree);
            this.visLayout(PobVisTree);
        }
    }

    visLayout(ATree){
        let nodeHasBeenSelected = this.props.nodeSelection.length > 0;
        let currentNodeExprID = Number.MIN_SAFE_INTEGER;
        let InvList:string[] = [];
        if(nodeHasBeenSelected) {
            currentNodeExprID = ATree[this.props.nodeSelection[0]].exprID;
            InvList = currentNodeExprID in this.props.PobLemmasMap ? this.props.PobLemmasMap[currentNodeExprID].map(exprInfo => exprInfo[0]): []
        }
        const visNodes = new Array<Node>();
        const visEdges = new Array<Edge>();
        let edgeId = 0;


        for (const nodeID in ATree){
            let node = ATree[nodeID];
            if(!node.to_be_vis) continue;
            let visNode;
            //Prioritize related nodes
            if (node.exprID === currentNodeExprID) {
                visNode = toVisNode(node, "sameExprID", this.props.nodeSelection)
            } else if (InvList.length > 0 && InvList.indexOf(node.exprID) >= 0){
                visNode = toVisNode(node, "lemma", this.props.nodeSelection, InvList.indexOf((node.exprID)) % 10);
            } else if (node.nodeID > this.props.currentTime) {
                visNode = toVisNode(node, "activated", this.props.nodeSelection);
            } else {
                visNode = toVisNode(node, "passive", this.props.nodeSelection);
            }

            visNodes.push(visNode);
            const visEdge = toVisEdge(edgeId, node.parent, node.nodeID, false);
            visEdges.push(visEdge);
            edgeId++;
        }
        this.networkNodes.clear();
        this.networkNodes.add(visNodes);
        this.networkEdges.clear();
        this.networkEdges.add(visEdges);

    }

    keyupHandler(event) {
        if(this.props.nodeSelection.length === 0) return;
        const selected_node = this.props.nodeSelection[0];
        let closest_node = findClosestNode(selected_node, event.key, this.network);
        this.props.onNodeSelectionChange([closest_node]);
    }
}
