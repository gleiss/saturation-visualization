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
    this.updateNetwork();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.dag !== prevProps.dag) {
      this.updateNetwork();
      this.network!.selectNodes(this.props.nodeSelection);
    } else {
      if (this.props.nodeSelection !== prevProps.nodeSelection) {
        this.network!.selectNodes(this.props.nodeSelection);
      }
      if (this.props.historyState !== prevProps.historyState) {
        this.updateNodeStyles();
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


  // NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  async updateNetwork() {

    // generate node and edge data
    const {dag, historyState} = this.props;
    const visNodes = new Array<Node>();
    const visEdges = new Array<Edge>();
    let edgeId = 0;
    // generate network-nodes as combination of nodes and their positions
    for (const satNode of dag.nodes.values()) {
      const visNode = this.toVisNode(satNode, historyState)
      visNodes.push(visNode);

      const edgesVisible = satNode.isFromPreprocessing || !!(satNode.newTime !== null && satNode.newTime <= historyState);
      for (const parentId of satNode.parents) {
        if (dag && dag.get(parentId)) {
          const visEdge = this.toVisEdge(edgeId, parentId, satNode.id, !edgesVisible);
          edgeId = edgeId + 1;
          visEdges.push(visEdge);
        }
      }
    }

    // QUESTION: it seems that using a single call to add is faster than separately adding each node. is this true?
    this.networkNodes.clear();
    this.networkNodes.add(visNodes);
    this.networkEdges.clear();
    this.networkEdges.add(visEdges);

    // center the dag
    this.network!.fit();
  }

  updateNodeStyles() {
    const {dag, historyState} = this.props;

    const visNodes = new Array<Node>();
    const visEdges = new Array<Edge>();
    let edgeId = 0;
    for (const satNode of this.props.dag.nodes.values()) {
      const visNode = this.toVisNode(satNode, historyState);
      visNodes.push(visNode);

      const edgesVisible = satNode.isFromPreprocessing || !!(satNode.newTime !== null && satNode.newTime <= historyState);
      for (const parentId of satNode.parents) {
        if (dag && dag.get(parentId)) {
          const visEdge = this.toVisEdge(edgeId, parentId, satNode.id, !edgesVisible);
          edgeId = edgeId + 1;
          visEdges.push(visEdge);
        }
      }
    }
    this.networkNodes.update(visNodes);
    this.networkEdges.update(visEdges);
  }


  selectStyle = (node: SatNode, historyState: number) => {
    if (node.inferenceRule === 'theory axiom') {
      if (node.activeTime !== null && node.activeTime <= historyState) {
        return styleTemplates.activeTheoryAxiom;
      } else if (node.passiveTime !== null && node.passiveTime <= historyState) {
        return styleTemplates.passiveTheoryAxiom;
      }
    }
    if (node.isFromPreprocessing) {
      return (node.parents.length > 0) ? styleTemplates.preprocessing : styleTemplates.input;
    }

    if (node.activeTime !== null && node.activeTime <= historyState) {
      return styleTemplates.active;
    } else if (node.passiveTime !== null && node.passiveTime <= historyState) {
      return styleTemplates.passive;
    } else if (node.newTime !== null && node.newTime <= historyState) {
      return styleTemplates.new;
    }

    return styleTemplates.hidden;
  };

  toVisNode(node: SatNode, historyState: number): any {
    const styleData = this.selectStyle(node, historyState);
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
    const toggledNode = this.toVisNode(this.props.dag.get(nodeId), this.props.historyState);
    this.networkNodes.update(toggledNode);
  }

}
