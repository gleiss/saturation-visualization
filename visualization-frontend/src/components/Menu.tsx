import * as React from 'react';
import {Link} from 'react-router-dom';
import './Menu.css';
import * as Monaco from 'monaco-editor'
import { assert } from '../model/util';

const icons = require('../resources/icons/all.svg') as string;

type Props = {
  problem: string,
  problemName: string,
    inputSyntax: 'smtlib' | 'tptp',

  spacerUserOptions: string,
  hideBracketsAssoc: boolean,
  nonStrictForNegatedStrictInequalities: boolean
  orientClauses: boolean,
  onChangeProblem: (problem: string) => void,
  onChangeProblemName: (problemName: string) => void,
  onChangeInputSyntax: (syntax: 'smtlib' | 'tptp') => void
  onChangeSpacerUserOptions: (spacerUserOptions: string) => void,
  onChangeHideBracketsAssoc: (newValue: boolean) => void,
  onChangeNonStrictForNegatedStrictInequalities: (newValue: boolean) => void,
  onChangeOrientClauses: (newValue: boolean) => void
}

export class Menu extends React.Component<Props, {}> {
  private isChromeOrFirefox = navigator.userAgent.indexOf('Chrome') > -1 || navigator.userAgent.indexOf('Firefox') > -1;
  private fileUpload = React.createRef<HTMLInputElement>();
  monacoDiv = React.createRef<HTMLDivElement>();
  monaco: Monaco.editor.IStandaloneCodeEditor | null = null

  componentDidMount() {
    if (!this.isChromeOrFirefox) {
      return;
    }
    // generate instance of Monaco Editor
    this.monaco = Monaco.editor.create(this.monacoDiv.current!, {
      lineNumbers: 'off',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 0,
      minimap: {
        enabled: false
      },
      renderLineHighlight: 'none',
      hideCursorInOverviewRuler: true,
      links: false,
      overviewRulerBorder: false,
      automaticLayout: true,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      wordWrap: 'wordWrapColumn'
      // fontFamily: "Monaco" TODO: decide which font to use. By default, multiple fonts are loaded, which is quite slow
    });
    this.monaco.setValue(this.props.problem);
    this.monaco.getModel()!.onDidChangeContent(() => {
      this.props.onChangeProblem(this.monaco!.getModel()!.getValue());
    });
  }

  componentDidUpdate(prevProps: Props) {
    assert(this.isChromeOrFirefox);
    if (this.props.problem !== prevProps.problem) {
      this.monaco!.setValue(this.props.problem);
    }
  }

  render() {
    if (!this.isChromeOrFirefox) {
      return (
        <section className="unsupported-message">
            <svg viewBox="0 0 24 24" className="icon">
              <use xlinkHref={`${icons}#alert-triangle`}/>
            </svg>
            <span>Your current browser is not supported. Please use Chrome or Firefox!</span>
        </section>
      );
    }

    return (
      <section className="component-menu">
        <h1>Spacer Visualization</h1>

        <section className="editor">
          <div className="editor-spacer">
            <main>
              <div className="headline-wrapper">
                <h2>Input</h2>
                <small className="file-name">{this.props.problemName}</small>
                <button title="Pick a new file" onClick={this.chooseFile.bind(this)}>
                  <svg viewBox="0 0 24 24" className="icon big">
                    <use xlinkHref={`${icons}#graph-upload`}/>
                  </svg>
                </button>
              </div>

              <input
                ref={this.fileUpload}
                type="file"
                onChange={this.uploadEncoding.bind(this)}
              />
              <div ref={this.monacoDiv} className="monaco"></div>
            </main>

            <aside>
              <fieldset className="options-card">
                <h3>Z3 Options</h3>
                <ul>
                  <li>
                    <label htmlFor="userOptions" className="form-label">Additional Spacer options</label>
                    <input id="userOptions" type="text" onChange={this.changeSpacerUserOptions.bind(this)}
                           value={this.props.spacerUserOptions}>
                    </input>
                  </li>
                </ul>
              </fieldset>

            </aside>
          </div>
        </section>

        <section className="run-menu">
          <Link to="/proof/" className="fake-button">Solve</Link>
        </section>
      </section>
    );
  }

  chooseFile() {
    if (this.fileUpload.current) {
      this.fileUpload.current.click();
    }
  }

  uploadEncoding(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files !== null && event.target.files.length > 0) {
      const file = event.target.files[0];

      const reader = new FileReader();
      // callback which will be executed when readAsText is called
      reader.onloadend = () => {
        const text = (reader.result ? reader.result : '') as string;
        this.props.onChangeProblem(text);
        this.props.onChangeProblemName(file.name);

        // guess inputSyntax from file extension:
        if (file.name.endsWith('.smt') || file.name.endsWith('.smtlib') || file.name.endsWith('.smt2') || file.name.endsWith('.smtlib2')) {
          this.props.onChangeInputSyntax('smtlib');
        } else if (file.name.endsWith('.tptp')) {
          this.props.onChangeInputSyntax('tptp');
        }
      };
      reader.readAsText(file);
    }
  }

  changeSpacerUserOptions(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;
    this.props.onChangeSpacerUserOptions(newValue);
  }

  changeTextArea(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = event.target.value;
    this.props.onChangeProblem(newValue);
  }

  changeHideBracketsAssoc(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.checked;
    this.props.onChangeHideBracketsAssoc(newValue);
  }

  changeNonStrictForNegatedStrictInequalities(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.checked;
    this.props.onChangeNonStrictForNegatedStrictInequalities(newValue);
  }

  changeInputSyntax(event: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = event.target.value as 'smtlib' | 'tptp';
    this.props.onChangeInputSyntax(newValue);
  }

  changeOrientClauses(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.checked;
    this.props.onChangeOrientClauses(newValue);
  }
}
