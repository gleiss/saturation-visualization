import * as React from 'react';

import './GraphMenu.css';


const icons = require('../resources/icons/all.svg') as string;

type Props = {
  nodeSelection: number[],
  versionCount: number,
  onUploadFile: (fileContent: string | ArrayBuffer) => void,
  onUndo: () => void,
  onRenderParentsOnly: () => void,
  onRenderChildrenOnly: () => void
};
export default class GraphMenu extends React.Component<Props, {}> {

  private fileUpload = React.createRef<HTMLInputElement>();

  render() {
    return (
      <section className="component-graph-menu">
        <input
          ref={this.fileUpload}
          type="file"
          onChange={this.updateProofFile.bind(this)}
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

        <button title="Render selection only (up)" disabled={!this.props.nodeSelection.length}
                onClick={this.props.onRenderParentsOnly}>
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#graph-up`}/>
          </svg>
        </button>

        <button title="Render selection only (down)" disabled={!this.props.nodeSelection.length}
                onClick={this.props.onRenderChildrenOnly}>
          <svg viewBox="0 0 24 24" className="icon big">
            <use xlinkHref={`${icons}#graph-down`}/>
          </svg>
        </button>
      </section>
    );
  }


  // FILE UPLOAD ///////////////////////////////////////////////////////////////////////////////////////////////////////

  chooseFile() {
    if (this.fileUpload.current) {
      this.fileUpload.current.click();
    }
  }

  updateProofFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.readAsText(file);
      reader.onloadend = () => {
        const text = reader.result ? reader.result : '';
        this.props.onUploadFile(text);
      };
    }
  }

}
