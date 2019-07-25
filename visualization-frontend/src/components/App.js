import React, {Component} from 'react';

import './App.css';
import Main from './Main';
import Aside from './Aside';

class App extends Component {

  state = {
    isLoaded: false,
    error: false,
    nodeSelection: []
  };

  componentWillMount() {
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            dag: result.dag,
            historyState: result.history_state,
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
    const {error, isLoaded, dag, historyState, nodeSelection} = this.state;

    if (error) {
      return (
        <div className="app">
          <main>
            <section className="placeholder">Error: {error.message}</section>
          </main>
          <Aside nodeSelection={nodeSelection}/>
        </div>
      );
    } else if (!isLoaded) {
      return (
        <div className="app">
          <main>
            <section className="placeholder">Loading...</section>
          </main>
          <Aside nodeSelection={nodeSelection}/>
        </div>
      );
    } else {
      return (
        <div className="app">
          <Main
            dag={dag}
            historyState={historyState}
            nodeSelection={nodeSelection}
            onNodeSelectionChange={this.updateNodeSelection.bind(this)}
          />
          <Aside nodeSelection={nodeSelection}/>
        </div>
      );
    }
  }

  updateNodeSelection(nodeSelection) {
    this.setState({nodeSelection});
  }

}

export default App;
