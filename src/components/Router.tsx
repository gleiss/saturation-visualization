import * as React from 'react';
import { HashRouter as HashRouter, Route, Link } from "react-router-dom";
import { AppWrapper } from './AppWrapper'
import { Menu } from './Menu'

type State = {
	problem: string,
	problemName: string,
	inputSyntax: "smtlib" | "tptp",
	vampireUserOptions: string,
	hideBracketsAssoc: boolean,
	nonStrictForNegatedStrictInequalities: boolean,
	orientClauses: boolean,
	logging: boolean
}

export class AppRouter extends React.Component<{}, State> {

	state: State = {
		problem: "",
		problemName: "",
		inputSyntax: "smtlib",
		vampireUserOptions: "",
		hideBracketsAssoc: true,
		nonStrictForNegatedStrictInequalities: true,
		orientClauses: true,
		logging: false
	}

	render() {
		return (
			<HashRouter>
				<Route path="/" exact render={() => 
					<Menu 
						problem={this.state.problem}
						problemName={this.state.problemName}
						inputSyntax={this.state.inputSyntax}
						vampireUserOptions={this.state.vampireUserOptions}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
						logging={this.state.logging}
						onChangeProblem={this.changeProblem.bind(this)}
						onChangeProblemName={this.changeProblemName.bind(this)}
						onChangeInputSyntax={this.changeInputSyntax.bind(this)}
						onChangeVampireUserOptions={this.changeVampireUserOptions.bind(this)}
						onChangeHideBracketsAssoc={this.changeHideBracketsAssoc.bind(this)}
						onChangeNonStrictForNegatedStrictInequalities={this.changeNonStrictForNegatedStrictInequalities.bind(this)}
						onChangeOrientClauses={this.changeOrientClauses.bind(this)}
						onChangeLogging={this.changeLogging.bind(this)}
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
			</HashRouter>
		);
	}

	appComponent(mode: "proof" | "saturation" | "manualcs") {
		const inputSyntax = this.state.inputSyntax === "smtlib" ? "smtlib2" : this.state.inputSyntax;
		const vampireUserOptions = `${this.state.vampireUserOptions} --input_syntax ${inputSyntax}`;

		return <AppWrapper
			name={this.state.problemName}
			mode={mode}
			problem={this.state.problem!}
			vampireUserOptions={vampireUserOptions}
			hideBracketsAssoc={this.state.hideBracketsAssoc}
			nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
			orientClauses={this.state.orientClauses}
			logging={this.state.logging}
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
	changeLogging(newValue: boolean) {
		this.setState({logging: newValue});
	}
}