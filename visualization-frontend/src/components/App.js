import React, {Component} from 'react';

import './App.css';
import Main from './Main';
import Aside from './Aside';
import Node from '../model/node';
import Dag from '../model/dag';

class App extends Component {
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
        <div className="app">
          <main>
            <section className="placeholder">Error: {error.message}</section>
          </main>
          <Aside/>
        </div>
      );
    } else if (!isLoaded) {
      return (
        <div className="app">
          <main>
            <section className="placeholder">Loading...</section>
          </main>
          <Aside/>
        </div>
      );
    } else {
      return (
        <div className="app">
          <Main graph={graph} selection={selection}/>
          <Aside/>
        </div>
      );
    }
  }
}

export default App;
