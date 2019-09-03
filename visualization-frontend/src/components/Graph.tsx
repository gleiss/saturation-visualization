import * as React from 'react';
import {DataSet, Network, IdType, Node} from 'vis'

import {Color, ColorStyle, EdgeColor, FontStyle} from '../model/network/network-style';
import './Graph.css'
import { assert } from '../model/util';

import Dag from '../model/dag';
import NetworkNode from '../model/network/network-node';
import NetworkEdge from '../model/network/network-edge';
import SatNode from '../model/sat-node';

const styleTemplates = require('../resources/styleTemplates');

type Props = {
  dag: Dag,
  nodeSelection: number[],
  historyState: number,
  onNodeSelectionChange: (selection: number[]) => void
};

export default class Graph extends React.Component<Props, {}> {

  markers = new Array<number>();
  network: Network | null = null;
  networkNodes = new DataSet<any>([]);
  networkEdges = new DataSet<NetworkEdge>([]);
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
      nodes: [],
      edges: []
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

    this.applyStoredMarkers(this.networkNodes);
  }

  async updateNetwork() {

    // generate node and edge data
    const {dag, historyState} = this.props;
    const networkNodes = new Array<NetworkNode>();
    const networkEdges = new Array<NetworkEdge>();

    // generate network-nodes as combination of nodes and their positions
    for (const [nodeId, node] of dag.nodes) {
      networkNodes.push(this.toNetworkNode(node, historyState));

      const edgesVisible = node.isFromPreprocessing || !!(node.newTime !== null && node.newTime <= historyState);
      node
        .parents
        .forEach(parentId => {
          if (dag && dag.get(parentId)) {
            networkEdges.push(this.toNetworkEdge(parentId, node.id, edgesVisible))
          }
        });
    }

    // update networkNodes and networkEdges
    // QUESTION: it seems that using a single call to add is faster than separately adding each node. is this true?
    // TODO: can we get altogether get rid of DataSet and use a standard dict or array instead?
    this.networkNodes.clear();
    this.networkEdges.clear();
    this.networkNodes.add(networkNodes);
    this.networkEdges.add(networkEdges);

    // force a rerender (TODO: this should not be necessary)
    this.network!.setData({nodes: networkNodes as any as Array<Node>, edges: networkEdges});
  }

  findNodeAt(clickPosition: {layerX: number, layerY: number}): IdType  {
    return this.network!.getNodeAt({
      x: clickPosition.layerX,
      y: clickPosition.layerY
    });
  }


  // STYLING ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  selectStyle = (node: SatNode, historyState: number) => {
    if (node.inferenceRule === 'theory axiom') {
      if (node.activeTime !== null && node.activeTime <= historyState) {
        return styleTemplates.activeTheoryAxiom;
      } else if (node.passiveTime !== null && node.passiveTime <= historyState) {
        return styleTemplates.passiveTheoryAxiom;
      }
    }

    if (node.isFromPreprocessing) {
      return node.parents ? styleTemplates.preprocessing : styleTemplates.input;
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

  getColorStyle = (styleData): ColorStyle => {
    return new ColorStyle(
      styleData.defaultStyle.background,
      styleData.defaultStyle.border,
      new Color(styleData.defaultStyle.background, styleData.defaultStyle.border),
      new Color(styleData.highlightStyle.background, styleData.highlightStyle.border),
      new Color(styleData.markedStyle.background, styleData.markedStyle.border)
    )
  };


  setStyle = (node: NetworkNode, newStyleKey: string) => {
    const newStyle = node.color.get(newStyleKey);

    node.color.background = newStyle.background;
    node.color.border = newStyle.border;
  };

  toNetworkNode = (node: SatNode, historyState: number): NetworkNode => {
    const styleData = this.selectStyle(node, historyState);

    const styleColor = this.getColorStyle(styleData);
    const styleFont = new FontStyle(styleData.text);
    const styleShape = styleData.shape;

    const positionX = node.getPosition()[0];
    const positionY = node.getPosition()[1];
    return new NetworkNode(node.id, styleColor, styleFont, node.toHTMLString(), node.inferenceRule, styleShape, Math.round(positionX * -70), Math.round(positionY * -120));
  };

  toNetworkEdge = (fromNode: number, toNode: number, visible: boolean): NetworkEdge => {
    return new NetworkEdge('to', new EdgeColor(visible ? 1.0 : 0.0, '#dddddd'), fromNode, toNode);
  };

  updateNodeStyles() {
    const updatedNetworkNodes = new Array<NetworkNode>();
    for (const satNode of this.props.dag.nodes.values()) {
      const networkNode = this.networkNodes.get(satNode.id);
      assert(networkNode);

      const styleData = this.selectStyle(satNode, this.props.historyState);
      networkNode.color = this.getColorStyle(styleData);
      networkNode.font = new FontStyle(styleData.text);
      networkNode.shape = styleData.shape;

      assert(!!networkNode);
      updatedNetworkNodes.push(networkNode);
    }
    this.networkNodes.update(updatedNetworkNodes);
  }


  // MARKERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  applyStoredMarkers(availableNodes: any) {
    this.markers
      .map(nodeId => availableNodes.get(nodeId))
      .forEach(node => {
        if (node) {
          this.setStyle(node, 'markedStyle');
          availableNodes.update(node);
        }
      });
  };

  toggleMarker(nodeId: number) {
    if (!this.networkNodes) {
      return;
    }
    const node = this.networkNodes.get(nodeId);
    const markerSet = new Set(this.markers);

    if (node) {
      if (markerSet.has(node.id)) {
        markerSet.delete(node.id);
        this.setStyle(node, 'defaultStyle');
      } else {
        markerSet.add(node.id);
        this.setStyle(node, 'markedStyle');
      }
      this.markers = Array.from(markerSet);
      this.networkNodes.update(node);
    }
  };

}
