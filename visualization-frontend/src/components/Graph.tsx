import * as React from 'react';
import {DataSet, Network, IdType, Node, Edge} from 'vis'

import './Graph.css'
import { assert } from '../model/util';

import Dag from '../model/dag';
import SatNode from '../model/sat-node';

const styleTemplates = require('../resources/styleTemplates');

type Props = {
  dag: Dag,
  nodeSelection: number[],
  historyState: number,
  onNodeSelectionChange: (selection: number[]) => void
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

    const {onNodeSelectionChange} = this.props;
    this.network.on('select', (newSelection) => onNodeSelectionChange(newSelection.nodes));
    this.network.on('oncontext', (rightClickEvent) => {
      const nodeId = this.findNodeAt(rightClickEvent.event) as number;
      if (nodeId) {
        this.toggleMarker(nodeId);
      }
      rightClickEvent.event.preventDefault();
    });
  }

  // updates the network displayed by Vis.js
  // if onlyUpdateStyles is false, all nodes and edges are newly generated.
  // if onlyUpdateStyles is true, only the attributes of the nodes and edges are updated
  updateNetwork(onlyUpdateStyles: boolean) {
    const {dag} = this.props;

    const visNodes = new Array<Node>();
    const visEdges = new Array<Edge>();
    let edgeId = 0;

    const styleMap = this.computeStyleMap();

    for (const [satNodeId, satNode] of dag.nodes) {
      const nodeStyle = styleMap.get(satNodeId);
      const visNode = this.toVisNode(satNode, nodeStyle);
      visNodes.push(visNode);

      for (const parentId of satNode.parents) {
        // TODO: why do we check whether the dag exists and whether the parentId exists?
        if (dag && dag.get(parentId)) {
          const visEdge = this.toVisEdge(edgeId, parentId, satNode.id, nodeStyle === "hidden");
          edgeId = edgeId + 1;
          visEdges.push(visEdge);
        }
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

  computeStyleMap(): Map<number, any> {
    const {dag, historyState, nodeSelection} = this.props;
    const selection = new Set<number>(nodeSelection.filter(nodeId => (dag.get(nodeId).activeTime !== null && (dag.get(nodeId).activeTime as number) <= historyState || dag.nodeIsInputNode(nodeId))));
    
    const passiveNodesForSelection = dag.computePassiveNodesForSelection(historyState, selection);
    const nodesInActivePassiveDag = dag.computeNodesInActiveAndPassiveDag(historyState, selection);

    const styleMap = new Map<number, any>();
    for (const [nodeId, node] of dag.nodes) {
      const isDeleted = (node.deletionTime !== null && node.deletionTime <= historyState);

      if (node.inferenceRule === "theory axiom") {
        styleMap.set(nodeId, isDeleted ? "theoryAxiomDeleted" : "theoryAxiom");
        continue;
      }
      if (node.isFromPreprocessing) {
        styleMap.set(nodeId, isDeleted ? "preprocessingDeleted" : "preprocessing");
        continue;
      }

      const isActivated = (node.activeTime !== null && node.activeTime <= historyState);
      if (isActivated) {
        styleMap.set(nodeId, isDeleted ? "activatedDeleted" : "active");
        continue;
      }

      if (!isDeleted && passiveNodesForSelection.has(nodeId)) {
        styleMap.set(nodeId, "passive");
        continue;
      }

      if (nodesInActivePassiveDag.has(nodeId)) {
        styleMap.set(nodeId, "deletedButContributing");
        continue;
      }

      styleMap.set(nodeId, "hidden");
    }

    return styleMap;
  }

  toVisNode(node: SatNode, style: string): any {
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
      hidden : (style === "hidden"),
      x : Math.round(node.getPosition()[0] * -70),
      y :  Math.round(node.getPosition()[1] * -120)
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

    const styleMap = this.computeStyleMap();
    const toggledNode = this.toVisNode(this.props.dag.get(nodeId), styleMap.get(nodeId));
    this.networkNodes.update(toggledNode);
  }

}
