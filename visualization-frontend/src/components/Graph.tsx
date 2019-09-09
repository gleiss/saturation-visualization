import * as React from 'react';
import {DataSet, Network, IdType, Node, Edge} from 'vis'

import './Graph.css'
import { assert } from '../model/util';

import { Dag } from '../model/dag';
import SatNode from '../model/sat-node';

const styleTemplates = require('../resources/styleTemplates');

type Props = {
  dag: Dag,
  nodeSelection: number[],
  historyState: number,
  onNodeSelectionChange: (selection: number[]) => void,
  onShowPassiveDag: (selection: Set<number>, currentTime: number) => void,
  onDismissPassiveDag: (selectedId: number) => void,
};

export default class Graph extends React.Component<Props, {}> {

  markers = new Set<number>();
  network: Network | null = null;
  networkNodes = new DataSet<Node>([]);
  networkEdges = new DataSet<Edge>([]);
  graphContainer = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.generateNetwork();
    this.updateNetwork(false);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.dag !== prevProps.dag) {
      this.updateNetwork(false);
      this.network!.selectNodes(this.props.nodeSelection);
    } else {
      if (this.props.nodeSelection !== prevProps.nodeSelection) {
        this.network!.selectNodes(this.props.nodeSelection);
      }
      if (this.props.historyState !== prevProps.historyState) {
        this.updateNetwork(true);
      }
    }
  }

  render() {
    return (
      <section className="component-graph" ref={this.graphContainer}>
        <canvas/>
      </section>
    );
  }


  // DISPLAY NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  generateNetwork() {
    assert(this.graphContainer.current);
    assert(!this.network); // should only be called once

    this.network = new Network(this.graphContainer.current!, {
      nodes: this.networkNodes,
      edges: this.networkEdges
    }, {
      physics: false,
      interaction: {
        multiselect: true
      }
    });

    this.network.on('select', (newSelection) => this.props.onNodeSelectionChange(newSelection.nodes));

    this.network.on('oncontext', async (rightClickEvent) => {
      rightClickEvent.event.preventDefault();
      const nodeId = this.findNodeAt(rightClickEvent.event) as number;
      if (nodeId !== undefined) {
        if (this.props.dag.isPassiveDag) {
          const styleMap = this.props.dag.styleMap as Map<number, string>;
          if (styleMap.get(nodeId) === "passive") {
            await this.props.onDismissPassiveDag(nodeId);
          }
        } else {
          const selection = new Set<number>();
          selection.add(nodeId);
          await this.props.onShowPassiveDag(selection, this.props.historyState);
        }
      }
    });
  }

  // updates the network displayed by Vis.js
  // if onlyUpdateStyles is false, all nodes and edges are newly generated.
  // if onlyUpdateStyles is true, only the attributes of the nodes and edges are updated
  updateNetwork(onlyUpdateStyles: boolean) {
    const {dag, historyState} = this.props;

    const visNodes = new Array<Node>();
    const visEdges = new Array<Edge>();
    let edgeId = 0;

    // partition nodes:
    // for standard dags, compute node partition
    // for passive dags use style map cached in dag
    const nodePartition = dag.isPassiveDag ? (dag.styleMap as Map<number, string>) : this.computeNodePartition(dag, historyState);

    // update network nodes
    for (const [satNodeId, satNode] of dag.nodes) {
      const nodeStyle = nodePartition.get(satNodeId);
      assert(nodeStyle !== undefined, "invar");
      if (nodeStyle === "hidden") {
        const visNode = {id : satNodeId, hidden : true};
        visNodes.push(visNode);
      } else {
        const visNode = this.toVisNode(satNode, nodeStyle, satNode.getPosition());
        visNodes.push(visNode);
      }

      for (const parentId of satNode.parents) {
        const visEdge = this.toVisEdge(edgeId, parentId, satNode.id, nodeStyle === "hidden");
        edgeId = edgeId + 1;
        visEdges.push(visEdge);
      }
    }

    if(onlyUpdateStyles) {
      // QUESTION: it seems that using a single call to update is faster than separately updating each node. is this true?
      this.networkNodes.update(visNodes);
      this.networkEdges.update(visEdges);
    } else {
      // QUESTION: it seems that using a single call to add is faster than separately adding each node. is this true?
      this.networkNodes.clear();
      this.networkNodes.add(visNodes);
      this.networkEdges.clear();
      this.networkEdges.add(visEdges);

      // center the dag
      this.network!.fit();
    }
  }

  computeNodePartition(dag: Dag, currentTime: number): Map<number, any> {

    const nodesInActiveDag = dag.computeNodesInActiveDag(currentTime);

    const nodePartition = new Map<number, any>();
    for (const [nodeId, node] of dag.nodes) {
      const isDeleted = (node.deletionTime !== null && node.deletionTime <= currentTime);

      if (node.inferenceRule === "theory axiom") {
        nodePartition.set(nodeId, isDeleted ? "theoryAxiomDeleted" : "theoryAxiom");
        continue;
      }
      if (node.isFromPreprocessing) {
        nodePartition.set(nodeId, isDeleted ? "preprocessingDeleted" : "preprocessing");
        continue;
      }

      const isActivated = (node.activeTime !== null && node.activeTime <= currentTime);
      if (isActivated) {
        nodePartition.set(nodeId, isDeleted ? "activatedDeleted" : "active");
        continue;
      }

      if (nodesInActiveDag.has(nodeId)) {
        nodePartition.set(nodeId, "deletedButContributing");
        continue;
      } 

      nodePartition.set(nodeId, "hidden");
    }

    return nodePartition;
  }

  toVisNode(node: SatNode, style: string, position: [number, number]): any {
    const styleData = styleTemplates[style];
    const isMarked = this.markers.has(node.id);

    return {
      id : node.id,
      label : node.toHTMLString(),
      labelHighlightBold : false,
      shape : "box",
      color : {
        border : isMarked ? styleData.markedStyle.border : styleData.defaultStyle.border,
        background : isMarked ? styleData.markedStyle.background : styleData.defaultStyle.background,
        highlight : {
          border : styleData.highlightStyle.border,
          background : styleData.highlightStyle.background
        }
      },
      font : {
        color : styleData.text,
        multi : true
      },
      hidden : false,
      x : Math.round(position[0] * -70),
      y : Math.round(position[1] * -120)
    };

  }

  toVisEdge(edgeId: number, parentNodeId: number, nodeId: number, hidden: boolean) {
    return {
      id : edgeId,
      arrows : "to",
      color : {
        color : "#dddddd",
        highlight : "#f8cfc1",
      },
      from : parentNodeId,
      to : nodeId,
      smooth : false,
      hidden : hidden
    }
  }


  // INTERACTION ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  findNodeAt(clickPosition: {layerX: number, layerY: number}): IdType  {
    return this.network!.getNodeAt({
      x: clickPosition.layerX,
      y: clickPosition.layerY
    });
  }


  // MARKERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  toggleMarker(nodeId: number) {
    assert(this.networkNodes);

    if (this.markers.has(nodeId)) {
      this.markers.delete(nodeId);
    } else {
      this.markers.add(nodeId);
    }
    this.updateNetwork(true);
  }

}
