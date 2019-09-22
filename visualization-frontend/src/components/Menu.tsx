import * as React from 'react';
import { Link } from "react-router-dom";
import './Menu.css';
import * as Monaco from 'monaco-editor'

type Props = {
	problem: string,
	problemName: string,
	inputSyntax: "smtlib" | "tptp",
	vampireUserOptions: string,
	hideBracketsAssoc: boolean,
	nonStrictForNegatedStrictInequalities: boolean
	orientClauses: boolean,
	onChangeProblem: (problem: string) => void,
	onChangeProblemName: (problemName: string) => void,
	onChangeInputSyntax: (syntax: "smtlib" | "tptp") => void
	onChangeVampireUserOptions: (vampireUserOptions: string) => void,
	onChangeHideBracketsAssoc: (newValue: boolean) => void,
	onChangeNonStrictForNegatedStrictInequalities: (newValue: boolean) => void,
	onChangeOrientClauses: (newValue: boolean) => void
}

export class Menu extends React.Component<Props, {}> {

	private fileUpload = React.createRef<HTMLInputElement>();
	monacoDiv = React.createRef<HTMLDivElement>();
	monaco: Monaco.editor.IStandaloneCodeEditor | null = null

	componentDidMount(){
		// generate instance of Monaco Editor
		this.monaco = Monaco.editor.create(this.monacoDiv.current!, {
			lineNumbers: "off",
			roundedSelection: false,
			scrollBeyondLastLine: false,
			scrollBeyondLastColumn: 0,
			minimap: {
				enabled: false
			},
			renderLineHighlight: "none",
			hideCursorInOverviewRuler: true,
			links: false,
			overviewRulerBorder: false,
			lineDecorationsWidth: 0,
			lineNumbersMinChars: 0,
			wordWrap: "wordWrapColumn"
			// fontFamily: "Monaco" TODO: decide which font to use. By default, multiple fonts are loaded, which is quite slow
		});
		this.monaco.setValue(this.props.problem);
		this.monaco.getModel()!.onDidChangeContent(() => {
			this.props.onChangeProblem(this.monaco!.getModel()!.getValue());
		});
	}

	componentDidUpdate(prevProps: Props){
		if (this.props.problem !== prevProps.problem) {
			this.monaco!.setValue(this.props.problem);
		}
	}

	render() {
		return (
			<section className="component-menu">
				<h1>Vampire Saturation Visualization</h1>
				
				<h3>Input:</h3>
				<div>
					<input
						ref={this.fileUpload}
						type="file"
						onChange={this.uploadEncoding.bind(this)}
					/>
					<button title="Pick a new file" onClick={this.chooseFile.bind(this)}>
						Upload
					</button>
					<label>{this.props.problemName}</label>
				</div>
				<div ref={this.monacoDiv} className="monaco"></div>

				<h3>Options:</h3>
				<p>Vampire:</p>
				<ul>
					<li>
						<label>
							<select onChange={this.changeInputSyntax.bind(this)} value={this.props.inputSyntax}>
								<option value="smtlib">SMTLIB</option>
								<option value="tptp">TPTP</option>
							</select>
							Input language
						</label>
					</li>
					<li>
						<label>
						<input type="text" onChange={this.changeVampireUserOptions.bind(this)} value={this.props.vampireUserOptions}>
						</input>
						Additional Vampire options
						</label>
					</li>
				</ul>
				<p>Visualization:</p>
				<ul>
					<li>
						<label>
						<input
							type="checkbox"
							checked={this.props.hideBracketsAssoc}
							onChange={this.changeHideBracketsAssoc.bind(this)} />
							Hide brackets for associative operators
						</label>
					</li>
					<li>
						<label>
						<input
							type="checkbox"
							checked={this.props.nonStrictForNegatedStrictInequalities}
							onChange={this.changeNonStrictForNegatedStrictInequalities.bind(this)} />
							Show negated strict inequalities as (positive) nonstrict inequalities
						</label>
					</li>
					<li>
						<label>
						<input
							type="checkbox"
							checked={this.props.orientClauses}
							onChange={this.changeOrientClauses.bind(this)} />
							Heuristically orient clauses
						</label>
					</li>
				</ul>

				<h3>Run:</h3>
				<button>
					<Link to="/proof/">Find proof</Link>
				</button>
				<button>
					<Link to="/saturation/">Find saturation</Link>
				</button>
				<button>
					<Link to="/manualcs/">Start manual clause selection</Link>
				</button>
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
				const text = (reader.result ? reader.result : "") as string;
				this.props.onChangeProblem(text);
				this.props.onChangeProblemName(file.name);
			};	
			reader.readAsText(file);
		}
	}

	changeVampireUserOptions(event: React.ChangeEvent<HTMLInputElement>) {
		const newValue = event.target.value;
		this.props.onChangeVampireUserOptions(newValue);
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
		const newValue = event.target.value as "smtlib" | "tptp";
		this.props.onChangeInputSyntax(newValue);
	}

	changeOrientClauses(event: React.ChangeEvent<HTMLInputElement>) {
		const newValue = event.target.checked;
		this.props.onChangeOrientClauses(newValue);
	}
}
