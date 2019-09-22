import * as React from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import App from './App'
import { Menu } from './Menu'

type State = {
	problem: string,
	problemName: string,
	inputSyntax: "smtlib" | "tptp",
	vampireUserOptions: string,
	hideBracketsAssoc: boolean,
	nonStrictForNegatedStrictInequalities: boolean,
	orientClauses: boolean
}

export class AppRouter extends React.Component<{}, State> {

	state: State = {
		problem: "",
		problemName: "",
		inputSyntax: "smtlib",
		vampireUserOptions: "",
		hideBracketsAssoc: true,
		nonStrictForNegatedStrictInequalities: true,
		orientClauses: true
	}

	render() {
		return (
			<Router>
				<Route path="/" exact render={() => 
					<Menu 
						problem={this.state.problem}
						problemName={this.state.problemName}
						inputSyntax={this.state.inputSyntax}
						vampireUserOptions={this.state.vampireUserOptions}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
						onChangeProblem={this.changeProblem.bind(this)}
						onChangeProblemName={this.changeProblemName.bind(this)}
						onChangeInputSyntax={this.changeInputSyntax.bind(this)}
						onChangeVampireUserOptions={this.changeVampireUserOptions.bind(this)}
						onChangeHideBracketsAssoc={this.changeHideBracketsAssoc.bind(this)}
						onChangeNonStrictForNegatedStrictInequalities={this.changeNonStrictForNegatedStrictInequalities.bind(this)}
						onChangeOrientClauses={this.changeOrientClauses.bind(this)}
					/>
				}/>
				<Route path="/proof/" render={() => 
					this.appComponent("proof")
				}/>
				<Route path="/saturation/" render={() => 
					this.appComponent("saturation")
				}/>
				<Route path="/manualcs/" render={() => 
					this.appComponent("manualcs")
				}/>
			</Router>
		);
	}

	appComponent(mode: "proof" | "saturation" | "manualcs") {
		const inputSyntax = this.state.inputSyntax === "smtlib" ? "smtlib2" : this.state.inputSyntax;
		const vampireUserOptions = `${this.state.vampireUserOptions} --input_syntax ${inputSyntax}`;

		return <App
			mode={mode}
			problem={this.state.problem!}
			vampireUserOptions={vampireUserOptions}
			hideBracketsAssoc={this.state.hideBracketsAssoc}
			nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
			orientClauses={this.state.orientClauses}
		/>
	}

	changeProblem(problem: string) {
		this.setState({problem: problem});
	}
	changeProblemName(problemName: string) {
		this.setState({problemName: problemName});
	}
	changeVampireUserOptions(vampireUserOptions: string) {
		this.setState({vampireUserOptions: vampireUserOptions});
	}
	changeHideBracketsAssoc(newValue: boolean) {
		this.setState({hideBracketsAssoc: newValue});
	}
	changeNonStrictForNegatedStrictInequalities(newValue: boolean) {
		this.setState({nonStrictForNegatedStrictInequalities: newValue});
	}
	changeInputSyntax(inputSyntax: "smtlib" | "tptp") {
		this.setState({inputSyntax: inputSyntax});
	}
	changeOrientClauses(newValue: boolean) {
		this.setState({orientClauses: newValue});
	}
}