import * as React from 'react';

import './Slider.css';


export default class Slider extends React.Component {
  render() {
    return (
      <section className="component-slider">
        <form id="sliderForm" action="" method="post">
          <input id="historySelection" type="hidden" name="historySelection"/>
          <input id="historyMarkers" type="hidden" name="marked"/>
          <input id="showPreviousStep" type="submit" name="decrease" value="-"/>
          <section className="wrapper">
            <small id="slideValue"/>
            <section id="slideContainer"/>
          </section>
          <input id="showNextStep" type="submit" name="increase" value="+"/>
        </form>
      </section>
    );
  }
}
