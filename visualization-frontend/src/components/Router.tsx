import * as React from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import App from './App'
import { Menu } from './Menu'

type State = {
	problem: string,
	problemName: string,
	vampireUserOptions: string,
	hideBracketsAssoc: boolean,
	nonStrictForNegatedStrictInequalities: boolean,
	inputSyntax: "smtlib" | "tptp",
	orientClauses: boolean
}

export class AppRouter extends React.Component<{}, State> {

	state: State = {
		problem: "",
		problemName: "",
		vampireUserOptions: "",
		hideBracketsAssoc: true,
		nonStrictForNegatedStrictInequalities: true,
		inputSyntax: "smtlib",
		orientClauses: true
	}

	render() {
		return (
			<Router>
				<Route path="/" exact render={() => 
					<Menu 
						problem={this.state.problem}
						problemName={this.state.problemName}
						vampireUserOptions={this.state.vampireUserOptions}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						inputSyntax={this.state.inputSyntax}
						orientClauses={this.state.orientClauses}
						onChangeProblem={this.changeProblem.bind(this)}
						onChangeProblemName={this.changeProblemName.bind(this)}
						onChangeVampireUserOptions={this.changeVampireUserOptions.bind(this)}
						onChangeHideBracketsAssoc={this.changeHideBracketsAssoc.bind(this)}
						onChangeNonStrictForNegatedStrictInequalities={this.changeNonStrictForNegatedStrictInequalities.bind(this)}
						onChangeInputSyntax={this.changeInputSyntax.bind(this)}
						onChangeOrientClauses={this.changeOrientClauses.bind(this)}
					/>
				}/>
				<Route path="/proof/" render={() => 
					<App 
						mode="proof" 
						problem={this.state.problem!}
						vampireUserOptions={this.state.vampireUserOptions}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
						inputSyntax={this.state.inputSyntax}
					/>
				}/>
				<Route path="/saturation/" render={() => 
					<App 
						mode="saturation" 
						problem={this.state.problem!}
						vampireUserOptions={this.state.vampireUserOptions}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
						inputSyntax={this.state.inputSyntax}
					/>
				}/>
				<Route path="/manualcs/" render={() => 
					<App 
						mode="manualcs" 
						problem={this.state.problem!}
						vampireUserOptions={this.state.vampireUserOptions}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
						inputSyntax={this.state.inputSyntax}
					/>
				}/>
			</Router>
		);
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