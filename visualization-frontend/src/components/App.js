import React, {Component} from 'react';

import './App.css';
import Main from './Main';
import Aside from './Aside';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="app">
        <Main/>
        <Aside/>
      </div>
    );
  }
}

export default App;
