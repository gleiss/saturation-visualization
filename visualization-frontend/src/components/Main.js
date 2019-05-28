import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoaded: false,
      error: false
    };
  }

  componentWillMount() {
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            graph: result.graph,
            selection: result.selection || [],
            order: result.order,
            error: false
          });
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  render() {
    const {error, isLoaded, graph, selection} = this.state;

    if (error) {
      return (
        <main>
          <section className="placeholder">Error: {error.message}</section>
        </main>
      );
    } else if (!isLoaded) {
      return (
        <main>
          <section className="placeholder">Loading...</section>
        </main>
      );
    } else {
      return (
        <main>
          <Graph graph={graph} selection={selection}/>
          <Slider/>
        </main>
      );
    }
  }
}
