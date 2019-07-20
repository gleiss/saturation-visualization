import React, {Component} from 'react';

import './App.css';
import Main from './Main';
import Aside from './Aside';

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
    const {error, isLoaded, dag, historyState} = this.state;

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
          <Main dag={dag} historyState={historyState}/>
          <Aside/>
        </div>
      );
    }
  }
}

export default App;
