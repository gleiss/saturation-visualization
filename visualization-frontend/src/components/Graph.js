import * as React from 'react';
import {DataSet, Network} from 'vis';

import './Graph.css';


export default class Graph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      graph: props.graph,
      selection: props.selection
    };
    this.network = {};
  }

  componentDidMount() {
    const {graph, selection} = this.state;
    const nodes = new DataSet(graph.nodes);
    const edges = new DataSet(graph.edges);
    const options = {
      physics: false,
      interaction: {
        multiselect: true
      }
    };
    this.network = new Network(this.graphContainer, {nodes, edges}, options);
    this.network.selectNodes(selection);
  }

  render() {
    return (
      <section id="graph" ref={ref => this.graphContainer = ref}>
        <canvas/>
      </section>
    );
  }
}
