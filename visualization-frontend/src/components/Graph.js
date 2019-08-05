import * as React from 'react';
import {DataSet, Network} from 'vis'

import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';
import {Color, ColorStyle, EdgeColor, FontStyle} from '../model/network/network-style';
import './Graph.css'

const styleTemplates = require('../resources/styleTemplates');
const PLAIN_PATTERN = /^node (\d+) ([0-9.]+) ([0-9.]+) [0-9.]+ [0-9.]+ ".+" [a-zA-Z ]+$/g;


export default class Graph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      nodeSelection: props.nodeSelection,
      historyState: props.historyState
    }
  }

  markers = [];
  network = null;
  networkNodes = new DataSet([]);
  graphContainer = React.createRef();

  async componentDidMount() {
    await this.generateNetwork();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.dag !== prevProps.dag) {
      await this.generateNetwork();
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

  async generateNetwork() {
    const {onNetworkChange, onNodeSelectionChange} = this.props;
    const graph = await this.generateNetworkData();
    this.networkNodes = new DataSet(graph.networkNodes);
    const networkEdges = new DataSet(graph.networkEdges);

    if (this.graphContainer.current) {
      if (this.network) {
        this.network.destroy();
      }

      this.network = new Network(this.graphContainer.current, {
        nodes: this.networkNodes,
        edges: networkEdges
      }, this.getNetworkOptions());

      this.network.on('select', (newSelection) => onNodeSelectionChange(newSelection.nodes));
      this.network.on('oncontext', (rightClickEvent) => {
        const nodeId = this.findNodeAt(rightClickEvent.event);
        if (nodeId) {
          this.toggleMarker(nodeId);
        }
        rightClickEvent.event.preventDefault();
      });

      this.applyStoredMarkers(this.networkNodes);

      onNetworkChange(this.network, this.networkNodes, networkEdges);
    }
  }

  async generateNetworkData() {
    const {dag, historyState} = this.props;
    const networkNodes = [];
    const networkEdges = [];
    const positions = await this.computePositions(dag ? Object.values(dag.nodes) : []);

    positions.forEach(position => {
      const node = dag ? dag.get(position.id) : null;
      if (node) {
        networkNodes.push(this.toNetworkNode(node, position, historyState));

        const edgesVisible = node.isFromPreprocessing || !!(node.newTime && node.newTime <= historyState);
        node
          .parents
          .forEach(parentId => {
            if (dag && dag.get(parentId)) {
              networkEdges.push(this.toNetworkEdge(parentId, node.id, edgesVisible))
            }
          });
      }
    });

    return {networkNodes, networkEdges};
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

  toDotString(nodes) {
    const dotStrings = [];

    nodes.forEach(node => {
      dotStrings.push(`${node.id} [label="${node.clause}"]`);
      node
        .parents
        .forEach(parent => dotStrings.push(`${parent} -> ${node.id}`));
    });

    return `digraph { ${dotStrings.join('; ')} }`;
  };

  async toGraphLayout(nodes) {
    let viz = new Viz({Module, render});

    return viz
      .renderString(this.toDotString(nodes), {format: 'plain'})
      .then((result) => {
        return result;
      })
      .catch((error) => {
        viz = new Viz({Module, render});
        console.error(error);
      });
  };

  async computePositions(nodes) {
    const graphLayout = await this.toGraphLayout(nodes);
    return graphLayout
      .split('\n')
      .filter((line) => line.startsWith('node'))
      .map((line) => line.matchAll(PLAIN_PATTERN).next().value)
      .filter((match) => !!match)
      .map((match) => {
        const [, number, x, y] = match;
        return {
          id: parseInt(number, 10),
          x: parseFloat(x),
          y: parseFloat(y)
        };
      });
  };


  // STYLING ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  selectStyle = (node, historyState) => {
    if (node.inferenceRule === 'theory axiom') {
      if (node.activeTime && node.activeTime <= historyState) {
        return styleTemplates.activeTheoryAxiom;
      } else if (node.passiveTime && node.passiveTime <= historyState) {
        return styleTemplates.passiveTheoryAxiom;
      }
    }

    if (node.isFromPreprocessing) {
      return node.parents ? styleTemplates.preprocessing : styleTemplates.input;
    }

    if (node.activeTime && node.activeTime <= historyState) {
      return styleTemplates.active;
    } else if (node.passiveTime && node.passiveTime <= historyState) {
      return styleTemplates.passive;
    } else if (node.newTime && node.newTime < historyState) {
      return styleTemplates.new;
    }

    return styleTemplates.hidden;
  };

  setStyle = (node, newStyleKey) => {
    const newStyle = node.color.get(newStyleKey);

    node.color.background = newStyle.background;
    node.color.border = newStyle.border;
  };

  toNetworkNode = (node, position, historyState) => {
    const styleData = this.selectStyle(node, historyState);

    return {
      id: node.id,
      color: this.getColorStyle(styleData),
      font: new FontStyle(styleData.text),
      label: node.clause,
      rule: node.inferenceRule,
      shape: styleData.shape,
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

  getColorStyle = (styleData) => {
    return new ColorStyle(
      styleData.defaultStyle.background,
      styleData.defaultStyle.border,
      new Color(styleData.defaultStyle.background, styleData.defaultStyle.border),
      new Color(styleData.highlightStyle.background, styleData.highlightStyle.border),
      new Color(styleData.markedStyle.background, styleData.markedStyle.border)
    )
  };


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
