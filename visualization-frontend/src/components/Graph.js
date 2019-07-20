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
  constructor(props) {
    super(props);

    this.state = {
      dag: props.dag,
      historyState: props.historyState
    };
    this.network = {};
  }

  async componentDidMount() {
    const graph = await this.generateGraph();
    const nodes = new DataSet(graph.nodes);
    const edges = new DataSet(graph.edges);
    const options = {
      physics: false,
      interaction: {
        multiselect: true
      }
    };
    this.network = new Network(this.graphContainer, {nodes, edges}, options);

    this.network.on('oncontext', (rightClickEvent) => {
      rightClickEvent.event.preventDefault();
      const clickedNodeNumber = this.network.getNodeAt({
        x: rightClickEvent.event.layerX,
        y: rightClickEvent.event.layerY
      });
      if (!clickedNodeNumber) {
        return;
      }

      const clickedNode = nodes.get(clickedNodeNumber);
      const marked = new Set(JSON.parse(sessionStorage.getItem('marked') || '[]'));
      if (marked.has(clickedNodeNumber)) {
        // remove marker
        marked.delete(clickedNodeNumber);
        clickedNode.color.background = clickedNode.color.default.background;
        clickedNode.color.border = clickedNode.color.default.border;
      } else {
        // add marker
        marked.add(clickedNodeNumber);
        clickedNode.color.background = clickedNode.color.marked.background;
        clickedNode.color.border = clickedNode.color.marked.border;
      }
      sessionStorage.setItem('marked', JSON.stringify(Array.from(marked)));
      nodes.update(clickedNode);
    });
  }

  render() {
    return (
      <section id="graph" ref={ref => this.graphContainer = ref}>
        <canvas/>
      </section>
    );
  }

  async generateGraph() {
    const {dag, historyState} = this.state;

    const positions = await this.generateNodePositions();

    const nodes = [];
    const edges = [];

    positions.forEach(position => {
      const node = dag.nodes[position.number];
      if (node) {
        const representation = this.computeRepresentation(node, historyState);
        nodes.push(this.formatNode(node, position, representation));

        const edgeVisible = node.is_from_preprocessing || (node.new_time && node.new_time <= historyState);

        node.parents.forEach(parentNumber => {
          const parent = dag.nodes[parentNumber];
          if (parent) {
            edges.push(this.formatEdge(parentNumber, node.number, edgeVisible));
          }
        });
      }
    });

    return {nodes, edges};
  }

  async generateNodePositions() {
    const layout = await this.computeLayout();

    return layout
      .split('\n')
      .filter(line => line.startsWith('node'))
      .map(line => line.matchAll(PLAIN_PATTERN).next().value)
      .filter(match => !!match)
      .map(match => {
        return {
          number: parseInt(match[1], 10),
          x: parseFloat(match[2]),
          y: parseFloat(match[3])
        };
      });
  }

  computeLayout() {
    const dotString = this.dotString();
    let viz = new Viz({Module, render});

    return viz.renderString(dotString, {format: 'plain'})
      .then(result => {
        return result;
      })
      .catch(error => {
        // Create a new Viz instance (@see Caveats page for more info)
        viz = new Viz({Module, render});
        console.error(error);
      });
  }

  dotString() {
    const {dag} = this.state;

    const dotStrings = [];

    Object.values(dag.nodes).forEach(node => {
      dotStrings.push(`${node.number} [label="${node.clause}"]`);
      node.parents.forEach(parent => dotStrings.push(`${parent} -> ${node.number}`));
    });

    return `digraph { ${dotStrings.join('; ')} }`;

  }

  computeRepresentation(node, historyState) {
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
  }

  formatNode(node, position, representation) {
    return {
      color: {
        background: representation.defaultStyle.background,
        border: representation.defaultStyle.border,
        highlight: {
          background: representation.highlightStyle.background,
          border: representation.highlightStyle.border
        },
        marked: {
          background: representation.markedStyle.background,
          border: representation.markedStyle.border
        },
        default: {
          background: representation.defaultStyle.background,
          border: representation.defaultStyle.border
        }
      },
      font: {
        color: representation.text
      },
      id: node.number,
      label: node.clause,
      rule: node.inference_rule,
      shape: representation.shape,
      x: Math.round(position.x * -70),
      y: Math.round(position.y * -120)
    }
  }


  formatEdge(parent, child, visible) {
    return {
      arrows: 'to',
      color: {
        opacity: visible ? 1.0 : 0.0,
        color: '#dddddd'
      },
      from: parent,
      to: child
    }
  }

}
