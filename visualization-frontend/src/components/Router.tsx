import * as React from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import App from './App'
import { Menu } from './Menu'

type State = {
	problem: string,
	hideBracketsAssoc: boolean,
	nonStrictForNegatedStrictInequalities: boolean,
	inputSyntax: "smtlib" | "tptp",
	orientClauses: boolean
}

export class AppRouter extends React.Component<{}, State> {

	state: State = {
		problem: "",
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
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						inputSyntax={this.state.inputSyntax}
						orientClauses={this.state.orientClauses}
						onSetProblem={this.setProblem.bind(this)}
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
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
						inputSyntax={this.state.inputSyntax}
					/>
				}/>
			</Router>
		);
	}

	setProblem(problem: string) {
		this.setState({problem: problem});
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