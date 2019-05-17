import * as React from 'react';

import './NodeMenu.css';


export default class NodeMenu extends React.Component {
  render() {
    return (
      <section className="component-node-menu">
        <section className="fake-form">
          <button id="selectParents"
                  disabled
                  title="Select parents"
                  onClick="selectParents()">A
          </button>
          <button id="selectChildren"
                  disabled
                  title="Select children"
                  onClick="selectChildren()">B
          </button>
        </section>

        <form action="" method="post">
          <input id="consequenceSelection" type="hidden" name="consequenceOrigins"/>
          <input id="consequenceMarkers" type="hidden" name="marked"/>

          <input type="submit"
                 id="findCommonConsequences"
                 disabled
                 value="C"
                 title="Find common consequences"/>
        </form>
      </section>
    );
  }
}
