import * as React from 'react';

import './GraphMenu.css';


export default class GraphMenu extends React.Component {

  state = {nodeSelection: []};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    }
  }

  render() {
    const {nodeSelection} = this.state;

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
        </form>

        <button
          title="Render selection only (up)"
          disabled={!nodeSelection.length}
          onClick={this.props.onRenderParentsOnly}
        >
        </button>

        <button
          title="Render selection only (down)"
          disabled={!nodeSelection.length}
          onClick={this.props.onRenderChildrenOnly}
        >
        </button>
      </section>
    );
  }

}
