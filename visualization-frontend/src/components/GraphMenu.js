import * as React from 'react';

import './GraphMenu.css';


export default class GraphMenu extends React.Component {

  state = {nodeSelection: []};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    } else if (this.props.versionCount !== prevProps.versionCount) {
      this.setState({
        versionCount: this.props.versionCount
      });
    }
  }

  render() {
    const {nodeSelection, versionCount} = this.state;
    const {onUndo, onRenderParentsOnly, onRenderChildrenOnly} = this.props;

    return (
      <section className="component-graph-menu">
        <input
          ref={ref => this.fileUpload = ref}
          type="file"
          onChange={(event) => this.updateProofFile(event.target.files[0])}
        />
        <button title="Pick a new file" onClick={this.chooseFile.bind(this)}>
        </button>

        <button title="Undo last graph transformation" disabled={!versionCount} onClick={onUndo}>
        </button>

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
