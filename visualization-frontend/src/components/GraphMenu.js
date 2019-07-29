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
    const {onRenderParentsOnly, onRenderChildrenOnly} = this.props;

    return (
      <section className="component-graph-menu">
        <input
          ref={ref => this.fileUpload = ref}
          type="file"
          onChange={(event) => this.updateProofFile(event.target.files[0])}
        />
        <button title="Pick a new file" onClick={this.chooseFile.bind(this)}>
        </button>

        <form action="" method="post">
          <input type="hidden" id="transformationSelection" name="selection"/>
          <input type="hidden" id="transformationMarkers" name="marked"/>

          <input type="submit"
                 id="undoLastStep"
                 value="undo"
                 title="Undo last transformation"
                 name="undo"/>
        </form>

        <button title="Render selection only (up)" disabled={!nodeSelection.length} onClick={onRenderParentsOnly}>
        </button>

        <button title="Render selection only (down)" disabled={!nodeSelection.length} onClick={onRenderChildrenOnly}>
        </button>
      </section>
    );
  }


  // FILE UPLOAD ///////////////////////////////////////////////////////////////////////////////////////////////////////

  chooseFile() {
    this.fileUpload.click();
  }

  updateProofFile(file) {
    const {onUploadFile} = this.props;
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onloadend = () => {
      onUploadFile(reader.result);
    };
  }

}
