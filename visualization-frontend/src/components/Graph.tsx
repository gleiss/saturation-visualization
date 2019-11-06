import * as React from 'react';
import { DataSet, Network, IdType, Node, Edge } from 'vis'

import './Graph.css'
import { assert } from '../model/util';

import { Dag } from '../model/dag';
import SatNode from '../model/sat-node';

const styleTemplates = require('../resources/styleTemplates');

type Props = {
    tree: any,
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
    dragStartEvent: any = null;
    cachedChangeNodesEvent?: Set<number> = undefined;

    componentDidMount() {
        this.generateNetwork();
        this.updateNetwork(false);
        this.network!.fit();
    }

    componentWillUnmount() {
    }

    componentDidUpdate(prevProps: Props) {
        this.updateNetwork(false);
        // if (this.props.dag !== prevProps.dag) {
        //     this.updateNetwork(false);
        //     this.network!.selectNodes(this.props.nodeSelection);
        //     if (this.props.nodeSelection.length > 0) {
        //         // center the view to selected nodes
        //         this.network!.fit({
        //             nodes: this.props.nodeSelection.map(nodeId => nodeId.toString()),
        //             animation: true
        //         });
        //     } else {
        //         // set the view so that the whole graph is visible
        //         this.network!.fit();
        //     }
        // } else {
        //     if (this.props.nodeSelection !== prevProps.nodeSelection) {
        //         this.network!.selectNodes(this.props.nodeSelection);
        //     }
        //     if (this.props.currentTime !== prevProps.currentTime) {
        //         this.updateNetwork(true);
        //     }
        //     const incomingEvent = this.props.changedNodesEvent;
        //     if (incomingEvent !== prevProps.changedNodesEvent) {
        //         assert(incomingEvent !== undefined);
        //         if (incomingEvent !== this.cachedChangeNodesEvent) {
        //             this.cachedChangeNodesEvent = incomingEvent;

        //             // update all nodes from event
        //             const visNodes = new Array<Node>();
        //             for (const nodeId of incomingEvent!) {
        //                 const visNode = {
        //                     id: nodeId,
        //                     label: this.props.dag.get(nodeId).toHTMLString(this.props.currentTime)
        //                 };
        //                 visNodes.push(visNode);
        //             }
        //             this.networkNodes.update(visNodes);
        //         }
        //     }
        // }
    }

    render() {
        return (
            <section className= "component-graph" ref = { this.graphContainer } >
                <canvas/>
                </section>
    );
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

        // this.network.on('click', async (clickEvent) => {
        //     if (clickEvent.nodes.length > 0) {
        //         assert(clickEvent.nodes.length === 1);
        //         const clickedNodeId = clickEvent.nodes[0];
        //         if (this.state.metaPressed) {
        //             if (this.props.nodeSelection.find((nodeId: number) => nodeId === clickedNodeId) !== undefined) {
        //                 this.props.onNodeSelectionChange(this.props.nodeSelection.filter((nodeId: number) => nodeId !== clickedNodeId));
        //             } else {
        //                 this.props.onNodeSelectionChange(this.props.nodeSelection.concat(clickEvent.nodes));
        //             }
        //         } else {
        //             this.props.onNodeSelectionChange(clickEvent.nodes);
        //         }
        //     } else {
        //         this.props.onNodeSelectionChange([]);
        //     }
        // });

        // this.network.on('dragStart', (dragStartEvent) => {
        //     assert(dragStartEvent !== undefined && dragStartEvent !== null);
        //     assert(dragStartEvent.nodes !== undefined && dragStartEvent.nodes !== null);
        //     this.dragStartEvent = dragStartEvent;
        //     if (dragStartEvent.nodes.length > 0) {
        //         this.props.onNodeSelectionChange(dragStartEvent.nodes);
        //     }
        // });

        // this.network.on('dragEnd', (dragEndEvent) => {
        //     assert(this.dragStartEvent !== undefined && this.dragStartEvent !== null);
        //     assert(this.dragStartEvent.nodes !== undefined && this.dragStartEvent.nodes !== null);
        //     assert(dragEndEvent !== undefined && dragEndEvent !== null);
        //     assert(dragEndEvent.nodes !== undefined && dragEndEvent.nodes !== null);
        //     if (dragEndEvent.nodes.length > 0 && !this.props.dag.isPassiveDag) {
        //         const deltaX = dragEndEvent.pointer.canvas.x - this.dragStartEvent.pointer.canvas.x;
        //         const deltaY = dragEndEvent.pointer.canvas.y - this.dragStartEvent.pointer.canvas.y;
        //         this.props.onUpdateNodePositions(dragEndEvent.nodes as Array<number>, [deltaX / (-70), deltaY / (-120)]);
        //     }
        // });
    }

    // updates the network displayed by Vis.js
    // if onlyUpdateStyles is false, all nodes and edges are newly generated.
    // if onlyUpdateStyles is true, only the attributes of the nodes and edges are updated
    updateNetwork(onlyUpdateStyles: boolean) {
        const visNodes = new Array<Node>();
        const visEdges = new Array<Edge>();
        //TODO: update nodes
        //TODO: update edges

        let edgeId = 0
        for (const node of this.props.tree){
            console.log(node)
            const visNode = this.toVisNode(node);
            visNodes.push(visNode);
            const visEdge = this.toVisEdge(edgeId, node.parent, node.nodeId, false);
            visEdges.push(visEdge);
            edgeId++;
        }


        this.networkNodes.clear();
        this.networkNodes.add(visNodes);
        this.networkEdges.clear();
        this.networkEdges.add(visEdges);

        // const { dag, currentTime } = this.props;

        // const visNodes = new Array<Node>();
        // const visEdges = new Array<Edge>();
        // let edgeId = 0;

        // // partition nodes:
        // // for standard dags, compute node partition
        // // for passive dags use style map cached in dag
        // const nodePartition = dag.isPassiveDag ? (dag.styleMap as Map<number, string>) : this.computeNodePartition(dag, currentTime);

        // // update network nodes
        // for (const [satNodeId, satNode] of dag.nodes) {
        //     const nodeStyle = nodePartition.get(satNodeId);
        //     assert(nodeStyle !== undefined, "invar");
        //     if (nodeStyle === "hidden") {
        //         const visNode = { id: satNodeId, hidden: true };
        //         visNodes.push(visNode);
        //     } else {
        //         const visNode = this.toVisNode(satNode, nodeStyle, satNode.getPosition());
        //         visNodes.push(visNode);
        //     }

        //     for (const parentId of satNode.parents) {
        //         const visEdge = this.toVisEdge(edgeId, parentId, satNode.id, nodeStyle === "hidden");
        //         edgeId = edgeId + 1;
        //         visEdges.push(visEdge);
        //     }
        // }

        // if (onlyUpdateStyles) {
        //     // QUESTION: it seems that using a single call to update is faster than separately updating each node. is this true?
        //     this.networkNodes.update(visNodes);
        //     this.networkEdges.update(visEdges);
        // } else {
        //     // QUESTION: it seems that using a single call to add is faster than separately adding each node. is this true?
        //     this.networkNodes.clear();
        //     this.networkNodes.add(visNodes);
        //     this.networkEdges.clear();
        //     this.networkEdges.add(visEdges);
        // }
    }

    toVisNode(node: any ): any {
        return {
            id: node.nodeId,
            labelHighlightBold: false,
            shape: "box",
        };

    }

    toVisEdge(edgeId: number, parentNodeId: number, nodeId: number, hidden: boolean) {
        console.log(edgeId, parentNodeId, nodeId);
        return {
            id: edgeId,
            arrows: "to",
            color: {
                color: "#dddddd",
                highlight: "#f8cfc1",
            },
            from: parentNodeId,
            to: nodeId,
            smooth: false,
            hidden: hidden
        }
    }

}
