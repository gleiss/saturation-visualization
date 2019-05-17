import * as React from 'react';

import Slider from './Slider';
import Graph from './Graph';


export default class Main extends React.Component {
  render() {
    return (
      <main>
        <Graph/>
        <Slider/>
      </main>
    );
  }
}
