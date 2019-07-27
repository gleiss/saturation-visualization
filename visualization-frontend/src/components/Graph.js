import * as React from 'react';
import {DataSet, Network} from 'vis';
import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';

import './Graph.css';

const PLAIN_PATTERN = /^node (\d+) ([0-9.]+) ([0-9.]+) [0-9.]+ [0-9.]+ ".+" [a-zA-Z ]+$/g;

const REPRESENTATIONS = {
  active: {
    defaultStyle: {
      background: '#dddddd',
      border: '#bbbbbb'
    },
    text: '#000000',
    shape: 'box',
    highlightStyle: {
      background: '#ee8866',
      border: '#ee8866'
    },
    markedStyle: {
      background: '#ffaabb',
      border: '#ee3377'
    }
  },
  passive: {
    defaultStyle: {
      background: '#f1f1f1',
      border: '#e3e3e3'
    },
    text: '#999999',
    shape: 'box',
    highlightStyle: {
      background: '#f8cfc1',
      border: '#f8cfc1'
    },
    markedStyle: {
      background: '#ffdde3',
      border: '#f8adc8'
    }
  },
  new: {
    defaultStyle: {
      background: '#f8f8f8',
      border: '#f1f1f1'
    },
    text: '#999999',
    shape: 'box',
    highlightStyle: {
      background: '#f8cfc1',
      border: '#f8cfc1'
    },
    markedStyle: {
      background: '#ffdde3',
      border: '#f8adc8'
    }
  },
  activeTheoryAxiom: {
    defaultStyle: {
      background: '#77aadd',
      border: '#4477aa'
    },
    text: '#000000',
    shape: 'box',
    highlightStyle: {
      background: '#ee8866',
      border: '#ee8866'
    },
    markedStyle: {
      background: '#ffaabb',
      border: '#ee3377'
    }
  },
  passiveTheoryAxiom: {
    defaultStyle: {
      background: '#c8ddf1',
      border: '#b4c8dd'
    },
    text: '#999999',
    shape: 'box',
    highlightStyle: {
      background: '#f8cfc1',
      border: '#f8cfc1'
    },
    markedStyle: {
      background: '#ffdde3',
      border: '#f8adc8'
    }
  },
  input: {
    defaultStyle: {
      background: '#44bb99',
      border: '#009988'
    },
    text: '#000000',
    shape: 'box',
    highlightStyle: {
      background: '#ee8866',
      border: '#ee8866'
    },
    markedStyle: {
      background: '#ffaabb',
      border: '#ee3377'
    }
  },
  preprocessing: {
    defaultStyle: {
      background: '#abe0d1',
      border: '#8cd1c9'
    },
    text: '#000000',
    shape: 'box',
    highlightStyle: {
      background: '#ee8866',
      border: '#ee8866'
    },
    markedStyle: {
      background: '#ffaabb',
      border: '#ee3377'
    }
  },
  hidden: {
    defaultStyle: {
      background: '#ffffff00',
      border: '#ffffff00'
    },
    text: '#ffffff00',
    shape: 'box',
    highlightStyle: {
      background: '#ffffff00',
      border: '#ffffff00'
    },
    markedStyle: {
      background: '#ffffff00',
      border: '#ffffff00'
    }
  }
};

export default class Graph extends React.Component {

  state = {
    nodeSelection: []
  };

  async componentDidMount() {
    await this.generateNetwork();
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.network.selectNodes(this.props.nodeSelection);
      this.setState({nodeSelection: this.props.nodeSelection})
    }
  }

  render() {
    return (
      <section id="graph" ref={ref => this.graphContainer = ref}>
        <canvas/>
      </section>
    );
  }


  // NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async generateNetwork() {
    const {onNetworkChange, onNodeSelectionChange} = this.props;
    const graph = await this.generateNetworkData();
    const networkNodes = new DataSet(graph.networkNodes);
    const networkEdges = new DataSet(graph.networkEdges);

    this.network = new Network(this.graphContainer, {
      nodes: networkNodes,
      edges: networkEdges
    }, this.getNetworkOptions());
    this.network.on('select', (newSelection) => onNodeSelectionChange(newSelection.nodes));
    this.network.on('oncontext', (rightClickEvent) => {
      const nodeNumber = this.findNodeAt(rightClickEvent.event);
      if (nodeNumber) {
        const clickedNode = networkNodes.get(nodeNumber);
        this.toggleMarker(clickedNode);
        networkNodes.update(clickedNode);
      }
      rightClickEvent.event.preventDefault();
    });

    onNetworkChange(this.network, networkNodes, networkEdges);
  }

  async generateNetworkData() {
    const {dag} = this.props;
    const networkNodes = [];
    const networkEdges = [];
    const positions = await this.computePositions(Object.values(dag.nodes));

    positions.forEach(position => {
      const node = dag.nodes[position.number];
      if (node) {
        networkNodes.push(this.toNetworkNode(node, position, 276));

        const edgesVisible = node.is_from_preprocessing || (node.new_time && node.new_time <= 276);
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

  toDotString = (nodes) => {
    const dotStrings = [];

    nodes.forEach(node => {
      dotStrings.push(`${node.number} [label="${node.clause}"]`);
      node
        .parents
        .forEach(parent => dotStrings.push(`${parent} -> ${node.number}`));
    });

    return `digraph { ${dotStrings.join('; ')} }`;
  };

  toGraphLayout = async (nodes) => {
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

  computePositions = async (nodes) => {
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

  selectStyle = (node, historyState) => {

    /* TODO clean up */

    if (node.inference_rule === 'theory axiom') {
      if (node.active_time && node.active_time <= historyState) {
        return REPRESENTATIONS['activeTheoryAxiom']
      } else if (node.passive_time && node.passive_time <= historyState) {
        return REPRESENTATIONS['passiveTheoryAxiom']
      }
    }
    if (node.is_from_preprocessing) {
      return node.parents ? REPRESENTATIONS['preprocessing'] : REPRESENTATIONS['input'];
    }
    if (node.active_time && node.active_time <= historyState) {
      return REPRESENTATIONS['active'];
    } else if (node.passive_time && node.passive_time <= historyState) {
      return REPRESENTATIONS['passive'];
    } else if (node.new_time && node.new_time < historyState) {
      return REPRESENTATIONS['new'];
    }

    return REPRESENTATIONS['hidden']
  };

  setStyle = (node, newStyleKey) => {
    const newStyle = node.color[newStyleKey];

    node.color.background = newStyle.background;
    node.color.border = newStyle.border;
  };

  toggleMarker = (node) => {
    const markers = new Set(this.getStoredMarkers());

    if (markers.has(node.id)) {
      markers.delete(node.id);
      this.setStyle(node, 'default');
    } else {
      markers.add(node.id);
      this.setStyle(node, 'marked');
    }
    this.storeMarkers(Array.from(markers));
  };

  toNetworkNode = (node, position, historyState) => {
    const styleData = this.selectStyle(node, historyState);

    return {
      id: node.number,
      color: {
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
      },
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


  // SESSION ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  getStoredMarkers = () => {
    return JSON.parse(sessionStorage.getItem('marked') || '[]');
  };

  storeMarkers = (markers) => {
    sessionStorage.setItem('marked', JSON.stringify(markers));
  };

}
