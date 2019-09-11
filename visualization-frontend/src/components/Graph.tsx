import * as React from 'react';
import {DataSet, Network, IdType, Node} from 'vis'

import {Color, ColorStyle, EdgeColor, FontStyle} from '../model/network/network-style';
import './Graph.css'
import { assert } from '../model/util';

import { runViz } from '../model/callViz';
import Dag from '../model/dag';
import NetworkNode from '../model/network/network-node';
import NetworkEdge from '../model/network/network-edge';
import SatNode from '../model/sat-node';

const styleTemplates = require('../resources/styleTemplates');
const PLAIN_PATTERN = /^(\d+) ([0-9.]+) ([0-9.]+).*$/g;

type Props = {
  dag: Dag,
  nodeSelection: number[],
  changedNode?: number,
  historyState: number,
  onNodeSelectionChange: (selection: number[]) => void
};

export default class Graph extends React.Component<Props, {}> {

  markers = new Array<number>();
  network: Network | null = null;
  networkNodes = new DataSet<any>([]);
  networkEdges = new DataSet<NetworkEdge>([]);
  graphContainer = React.createRef<HTMLDivElement>();

  layoutCache = new Map<Dag, Array<{id: number, x: number, y: number}>>();

  async componentDidMount() {
    this.generateNetwork();
    await this.updateNetwork();
  }

  async componentDidUpdate(prevProps: Props) {
    if (this.props.dag !== prevProps.dag) {
      await this.updateNetwork();
      this.network!.selectNodes(this.props.nodeSelection);
    } else {
      if (this.props.nodeSelection !== prevProps.nodeSelection) {
        this.network!.selectNodes(this.props.nodeSelection);
      }
      if (this.props.historyState !== prevProps.historyState) {
        this.updateNodeStyles();
      }
      if (this.props.changedNode) {
        // TODO
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

    // lookup or compute positions
    let positions;
    if(this.layoutCache.has(dag))
    {
      positions = this.layoutCache.get(dag);
    }
    else
    {
      positions = await this.computePositions(dag);
      this.layoutCache.set(dag, positions);
    }

    // generate network-nodes as combination of nodes and their positions
    positions.forEach(position => {
      assert(dag.get(position.id));
      const node = dag.get(position.id);

      networkNodes.push(this.toNetworkNode(node, position, historyState));

      const edgesVisible = node.isFromPreprocessing || !!(node.newTime !== null && node.newTime <= historyState);
      node
        .parents
        .forEach(parentId => {
          if (dag && dag.get(parentId)) {
            networkEdges.push(this.toNetworkEdge(parentId, node.id, edgesVisible))
          }
        });
    });

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


  // POSITIONING ///////////////////////////////////////////////////////////////////////////////////////////////////////
  async computePositions(dag: Dag): Promise<Array<{id: number, x: number, y: number}>> {
    // generate dot string
    const dotString = this.dagToDotString(dag);
    
    // use viz to compute layout for dag given as dotstring
    // note that viz returns the layout as a string
    const layoutString = await runViz(dotString);

    // parse the layout string into array of network-nodes
    return this.parseLayoutString(layoutString);
  };

  dagToDotString(dag: Dag): string {
    // TODO: make sure boundary nodes are handled properly
    // TODO: document
    const inputStrings = new Array<string>();
    const preprocessingStrings = new Array<string>();
    const otherStrings = new Array<string>();
    const edgeStrings = new Array<string>();
    for (const node of dag.nodes.values()) {
      if (node.isFromPreprocessing) {
        if(dag.nodeIsInputNode(node.id)) {
          inputStrings.push(`${node.id} [label="${node.toString()}"]`);
        } else {
          preprocessingStrings.push(`${node.id} [label="${node.toString()}"]`);
        }
      }
    }
    for (const node of dag.nodes.values()) {
      if (!node.isFromPreprocessing) {
        otherStrings.push(`${node.id} [label="${node.toString()}"]`);
      }
    }

    for (const node of dag.nodes.values()) {
      for (const parentId of node.parents) {
        edgeStrings.push(`${parentId} -> ${node.id}`)
      }
    }

    const inputString = "   subgraph inputgraph {\n      rank=source;\n      " + inputStrings.join(";\n      ") + "\n   }";
    const preprocessingString = "   subgraph preprocessinggraph {\n      rank=same;\n      " + preprocessingStrings.join(";\n      ") + "\n   }";
    const otherstring = "   subgraph othergraph {\n      " + otherStrings.join(";\n      ") + "\n   }";
    const edgeString = edgeStrings.join(";\n   ");

    const dotString =  "digraph {\n\n" + inputString + "\n\n" + preprocessingString + "\n\n" + otherstring + "\n\n   " + edgeString + "\n}";
    
    return dotString;
  };

  parseLayoutString(layoutString: string): Array<{id: number, x: number, y: number}> {
    let firstEdgeLineIndex = layoutString.includes('\nedge') ? layoutString.indexOf('\nedge') : layoutString.length;
    // split layoutString to array of strings describing positions of nodes
    const parsedNodeLines = layoutString
      .substr(0, firstEdgeLineIndex) // ignore remaining part of string describing edges
      .split('\nnode ') //split lines
      .slice(1) // ignore first line describing graph
      .map(line => line.substr(0, line.indexOf('"'))) // ignore remaining part of line causing problems with line breaks
      .map((line) => line.matchAll(PLAIN_PATTERN).next().value); // parse each remaining line
    parsedNodeLines.forEach(line => {
      assert(line !== undefined); // check that each remaining line was successfully parsed
    });
    // generate network node for each nodeString
    return parsedNodeLines
      .map((match) => {
        const [, number, x, y] = match;
        return {
          id: parseInt(number, 10),
          x: parseFloat(x),
          y: parseFloat(y)
        };
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

  toNetworkNode = (node: SatNode, position: {id: number, x: number, y: number}, historyState: number): NetworkNode => {
    const styleData = this.selectStyle(node, historyState);

    const styleColor = this.getColorStyle(styleData);
    const styleFont = new FontStyle(styleData.text);
    const styleShape = styleData.shape;
    

    return new NetworkNode(node.id, styleColor, styleFont, node.toHTMLString(), node.inferenceRule, styleShape, Math.round(position.x * -70), Math.round(position.y * -120));
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
