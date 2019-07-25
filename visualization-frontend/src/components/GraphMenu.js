import * as React from 'react';

import './GraphMenu.css';


export default class GraphMenu extends React.Component {

  state = {};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    }
  }

  render() {
    return (
      <section className="component-graph-menu">
        <form id="fileForm" action="" method="post" encType="multipart/form-data">
          <input type="hidden" id="fileUpload" name="file"/>
          <input type="file" id="fileSelector" className="hidden" onChange="uploadFile(this.files)"/>

          <input type="button"
                 id="uploadFileButton"
                 value="file"
                 title="Pick a new file"
                 onClick="chooseFile()"/>
        </form>

        <form action="" method="post">
          <input type="hidden" id="transformationSelection" name="selection"/>
          <input type="hidden" id="transformationMarkers" name="marked"/>

          <input type="submit"
                 id="undoLastStep"
                 value="undo"
                 title="Undo last transformation"
                 name="undo"/>
          <input type="submit"
                 id="selectUp"
                 disabled
                 value="up"
                 title="Render selection only (up)"
                 name="up"/>
          <input type="submit"
                 id="selectDown"
                 disabled
                 value="down"
                 title="Render selection only (down)"
                 name="down"/>
        </form>
      </section>
    );
  }

}
