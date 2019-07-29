import * as React from 'react';
import {DataSet, Network} from 'vis';
import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';

import styleTemplates from '../resources/styleTemplates';
import './Graph.css';


const PLAIN_PATTERN = /^node (\d+) ([0-9.]+) ([0-9.]+) [0-9.]+ [0-9.]+ ".+" [a-zA-Z ]+$/g;


export default class Graph extends React.Component {

  state = {
    nodeSelection: []
  };

  async componentDidMount() {
    await this.generateNetwork();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.dag !== prevProps.dag) {
      await this.generateNetwork();
    } else if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.network.selectNodes(this.props.nodeSelection);
      this.setState({nodeSelection: this.props.nodeSelection})
    } else if (this.props.historyState !== prevProps.historyState) {
      this.setHistoryStyles(this.props.historyState);
      this.setState({historyState: this.props.historyState})
    }
  }

  render() {
    return (
      <section className="component-graph" ref={ref => this.graphContainer = ref}>
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

    if (this.network) {
      this.network.destroy();
    }
    this.network = new Network(this.graphContainer, {
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

  async generateNetworkData() {
    const {dag, historyState} = this.props;
    const networkNodes = [];
    const networkEdges = [];
    const positions = await this.computePositions(Object.values(dag.nodes));

    positions.forEach(position => {
      const node = dag.nodes[position.number];
      if (node) {
        networkNodes.push(this.toNetworkNode(node, position, historyState));

        const edgesVisible = node.is_from_preprocessing || (node.new_time && node.new_time <= historyState);
        node
          .parents
          .filter(parentNumber => !!dag.nodes[parentNumber])
          .forEach(parentNumber => networkEdges.push(this.toNetworkEdge(parentNumber, node.number, edgesVisible)));
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
      dotStrings.push(`${node.number} [label="${node.clause}"]`);
      node
        .parents
        .forEach(parent => dotStrings.push(`${parent} -> ${node.number}`));
    });

    return `digraph { ${dotStrings.join('; ')} }`;
  };

  async toGraphLayout(nodes) {
    let viz = new Viz({Module, render});

    return viz
      .renderString(this.toDotString(nodes), {format: 'plain'})
      .then(result => {
        return result;
      })
      .catch(error => {
        viz = new Viz({Module, render});
        console.error(error);
      });
  };

  async computePositions(nodes) {
    const graphLayout = await this.toGraphLayout(nodes);
    return graphLayout
      .split('\n')
      .filter(line => line.startsWith('node'))
      .map(line => line.matchAll(PLAIN_PATTERN).next().value)
      .filter(match => !!match)
      .map(match => {
        const [, number, x, y] = match;
        return {
          number: parseInt(number, 10),
          x: parseFloat(x),
          y: parseFloat(y)
        };
      });
  };


  // STYLING ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  setHistoryStyles(historyState) {
    const {dag} = this.props;
    const networkNodesToUpdate = [];

    Object.values(dag.nodes)
      .filter(node => !!this.networkNodes.get(node.number))
      .forEach(node => {
        const networkNode = this.networkNodes.get(node.number);
        const styleData = this.selectStyle(node, historyState);

        networkNode.color = this.getColorStyle(styleData);
        networkNode.font.color = styleData.text;
        networkNode.shape = styleData.shape;
        networkNodesToUpdate.push(networkNode);
      });
    this.networkNodes.update(networkNodesToUpdate);
  }

  selectStyle = (node, historyState) => {

    /* TODO clean up */

    if (node.inference_rule === 'theory axiom') {
      if (node.active_time && node.active_time <= historyState) {
        return styleTemplates.activeTheoryAxiom;
      } else if (node.passive_time && node.passive_time <= historyState) {
        return styleTemplates.passiveTheoryAxiom;
      }
    }

    if (node.is_from_preprocessing) {
      return node.parents ? styleTemplates.preprocessing : styleTemplates.input;
    }

    if (node.active_time && node.active_time <= historyState) {
      return styleTemplates.active;
    } else if (node.passive_time && node.passive_time <= historyState) {
      return styleTemplates.passive;
    } else if (node.new_time && node.new_time < historyState) {
      return styleTemplates.new;
    }

    return styleTemplates.hidden;
  };

  setStyle = (node, newStyleKey) => {
    const newStyle = node.color[newStyleKey];

    node.color.background = newStyle.background;
    node.color.border = newStyle.border;
  };

  toNetworkNode = (node, position, historyState) => {
    const styleData = this.selectStyle(node, historyState);

    return {
      id: node.number,
      color: this.getColorStyle(styleData),
      font: {
        color: styleData.text
      },
      label: node.clause,
      rule: node.inference_rule,
      shape: styleData.shape,
      x: Math.round(position.x * -70),
      y: Math.round(position.y * -120)
    }
  };

  toNetworkEdge = (fromNode, toNode, visible) => {
    return {
      arrows: 'to',
      color: {
        opacity: visible ? 1.0 : 0.0,
        color: '#dddddd'
      },
      from: fromNode,
      to: toNode
    }
  };

  getColorStyle = (styleData) => {
    return {
      background: styleData.defaultStyle.background,
      border: styleData.defaultStyle.border,
      default: {
        background: styleData.defaultStyle.background,
        border: styleData.defaultStyle.border
      },
      highlight: {
        background: styleData.highlightStyle.background,
        border: styleData.highlightStyle.border
      },
      marked: {
        background: styleData.markedStyle.background,
        border: styleData.markedStyle.border
      }
    }
  };


  // MARKERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  applyStoredMarkers(availableNodes) {
    const markers = this.getStoredMarkers();

    markers
      .map(nodeId => availableNodes.get(nodeId))
      .filter(node => !!node)
      .forEach(node => {
        this.setStyle(node, 'marked');
        availableNodes.update(node);
      });
  };

  toggleMarker(nodeId) {
    const node = this.networkNodes.get(nodeId);
    const markers = new Set(this.getStoredMarkers());

    if (markers.has(node.id)) {
      markers.delete(node.id);
      this.setStyle(node, 'default');
    } else {
      markers.add(node.id);
      this.setStyle(node, 'marked');
    }
    this.storeMarkers(Array.from(markers));
    this.networkNodes.update(node);
  };

  getStoredMarkers = () => {
    return JSON.parse(sessionStorage.getItem('marked') || '[]');
  };

  storeMarkers = (markers) => {
    sessionStorage.setItem('marked', JSON.stringify(markers));
  };

}
