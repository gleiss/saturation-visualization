import * as React from 'react';

import icons from '../resources/icons/all.svg';
import './GraphMenu.css';


export default class GraphMenu extends React.Component {

  render() {
    return (
      <section className="component-graph-menu">
        <input
          ref={ref => this.fileUpload = ref}
          type="file"
          onChange={(event) => this.updateProofFile(event.target.files[0])}
        />
        <button title="Pick a new file" onClick={this.chooseFile.bind(this)}>
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#graph-upload`}/>
          </svg>
        </button>

        <button title="Undo last graph transformation" disabled={!this.props.versionCount} onClick={this.props.onUndo}>
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#graph-undo`}/>
          </svg>
        </button>

        <button title="Render selection only (up)" disabled={!this.props.nodeSelection.length} onClick={this.props.onRenderParentsOnly}>
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#graph-up`}/>
          </svg>
        </button>

        <button title="Render selection only (down)" disabled={!this.props.nodeSelection.length} onClick={this.props.onRenderChildrenOnly}>
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#graph-down`}/>
          </svg>
        </button>
      </section>
    );
  }


  // FILE UPLOAD ///////////////////////////////////////////////////////////////////////////////////////////////////////

  chooseFile() {
    this.fileUpload.click();
  }

  updateProofFile(file) {
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onloadend = () => {
      this.props.onUploadFile(reader.result);
    };
  }

}
