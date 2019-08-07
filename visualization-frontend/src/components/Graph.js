import * as React from 'react';
import {DataSet, Network} from 'vis'

import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';
import {Color, ColorStyle, EdgeColor, FontStyle} from '../model/network/network-style';
import './Graph.css'
import { assert } from '../model/util';

const styleTemplates = require('../resources/styleTemplates');
const PLAIN_PATTERN = /^(\d+) ([0-9.]+) ([0-9.]+).*$/g;


export default class Graph extends React.Component {

  markers = [];
  network = null;
  networkNodes = new DataSet([]);
  networkEdges = new DataSet([]);
  graphContainer = React.createRef();

  layoutCache = new Map();

  async componentDidMount() {
    this.generateNetwork();
    await this.updateNetwork();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.dag !== prevProps.dag) {
      await this.updateNetwork();
      this.network.selectNodes(this.props.nodeSelection);
    } else {
      if (this.props.nodeSelection !== prevProps.nodeSelection) {
        this.network.selectNodes(this.props.nodeSelection);
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

    this.network = new Network(this.graphContainer.current, {
      nodes: [],
      edges: []
    }, this.getNetworkOptions());

    const {onNodeSelectionChange} = this.props;
    this.network.on('select', (newSelection) => onNodeSelectionChange(newSelection.nodes));
    this.network.on('oncontext', (rightClickEvent) => {
      const nodeId = this.findNodeAt(rightClickEvent.event);
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
    const networkNodes = [];
    const networkEdges = [];

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
    this.network.setData({nodes: networkNodes,edges: networkEdges});
  }

  findNodeAt(clickPosition) {
    return this.network.getNodeAt({
      x: clickPosition.layerX,
      y: clickPosition.layerY
    });
  }

  getNetworkOptions = () => {
    return {
      physics: false,
      interaction: {
        multiselect: true
      }
    };
  };


  // POSITIONING ///////////////////////////////////////////////////////////////////////////////////////////////////////
  async computePositions(dag) {
    // generate dot string
    const dotString = this.dagToDotString(dag);
    
    // use viz to compute layout for dag given as dotstring
    // note that viz returns the layout as a string
    const layoutString = await this.runViz(dotString);

    // parse the layout string into array of network-nodes
    return this.parseLayoutString(layoutString);
  };

  dagToDotString(dag) {
    const dotStrings = [];

    const nodes = Object.values(dag.nodes);
    nodes.forEach(node => {
      dotStrings.push(`${node.id} [label="${node.clause}"]`);
      node
        .parents
        .forEach(parent => dotStrings.push(`${parent} -> ${node.id}`));
    });

    return `digraph { ${dotStrings.join('; ')} }`;
  };

  async runViz(dotString) {
    let viz = new Viz({Module, render});

    return viz
      .renderString(dotString, {format: 'plain'})
      .then((result) => {
        return result;
      })
      .catch((error) => {
        viz = new Viz({Module, render});
        console.error(error);
      });
  };

  parseLayoutString(layoutString) {
    // split layoutString to array of strings describing positions of nodes
    const parsedNodeLines = layoutString
      .substr(0, layoutString.indexOf('\nedge')) // ignore remaining part of string describing edges
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

  selectStyle = (node, historyState) => {
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
    } else if (node.newTime !== null && node.newTime < historyState) { // TODO: check that < is correct instead of <=
      return styleTemplates.new;
    }

    return styleTemplates.hidden;
  };

  getColorStyle = (styleData) => {
    return new ColorStyle(
      styleData.defaultStyle.background,
      styleData.defaultStyle.border,
      new Color(styleData.defaultStyle.background, styleData.defaultStyle.border),
      new Color(styleData.highlightStyle.background, styleData.highlightStyle.border),
      new Color(styleData.markedStyle.background, styleData.markedStyle.border)
    )
  };


  setStyle = (node, newStyleKey) => {
    const newStyle = node.color.get(newStyleKey);

    node.color.background = newStyle.background;
    node.color.border = newStyle.border;
  };

  toNetworkNode = (node, position, historyState) => {
    const styleData = this.selectStyle(node, historyState);

    const styleColor = this.getColorStyle(styleData);
    const styleFont = new FontStyle(styleData.text);
    const styleShape = styleData.shape;
    
    return {
      id: node.id,
      color: styleColor,
      font: styleFont,
      label: node.clause,
      rule: node.inferenceRule,
      shape: styleShape,
      x: Math.round(position.x * -70),
      y: Math.round(position.y * -120)
    }
  };

  toNetworkEdge = (fromNode, toNode, visible) => {
    return {
      arrows: 'to',
      color: new EdgeColor(visible ? 1.0 : 0.0, '#dddddd'),
      from: fromNode,
      to: toNode
    }
  };

  updateNodeStyles() {
    this.networkNodes.update(
      Object.values(this.props.dag.nodes)
        .map(satNode => {
          const node = this.networkNodes.get(satNode.id);
          if (node) {
            const styleData = this.selectStyle(satNode, this.props.historyState);
            node.color = this.getColorStyle(styleData);
            node.font = new FontStyle(styleData.text);
            node.shape = styleData.shape;
          }
          return node;
        })
        .filter(node => !!node));
  }


  // MARKERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  applyStoredMarkers(availableNodes) {
    this.markers
      .map(nodeId => availableNodes.get(nodeId))
      .forEach(node => {
        if (node) {
          this.setStyle(node, 'markedStyle');
          availableNodes.update(node);
        }
      });
  };

  toggleMarker(nodeId) {
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
