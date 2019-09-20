import * as React from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import App from './App'
import { Menu } from './Menu'

type State = {
	problem: string,
	hideBracketsAssoc: boolean,
	nonStrictForNegatedStrictInequalities: boolean,
	inputSyntaxSmtlib: boolean,
	orientClauses: boolean
}

export class AppRouter extends React.Component<{}, State> {

	state: State = {
		problem: "",
		hideBracketsAssoc: true,
		nonStrictForNegatedStrictInequalities: true,
		inputSyntaxSmtlib: true,
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
						inputSyntaxSmtlib={this.state.inputSyntaxSmtlib}
						orientClauses={this.state.orientClauses}
						onSetProblem={this.setProblem.bind(this)}
						onChangeHideBracketsAssoc={this.changeHideBracketsAssoc.bind(this)}
						onChangeNonStrictForNegatedStrictInequalities={this.changeNonStrictForNegatedStrictInequalities.bind(this)}
						onChangeInputSyntaxSmtlib={this.changeInputSyntaxSmtlib.bind(this)}
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
					/>
				}/>
				<Route path="/saturation/" render={() => 
					<App 
						mode="saturation" 
						problem={this.state.problem!}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
					/>
				}/>
				<Route path="/manualcs/" render={() => 
					<App 
						mode="manualcs" 
						problem={this.state.problem!}
						hideBracketsAssoc={this.state.hideBracketsAssoc}
						nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
						orientClauses={this.state.orientClauses}
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
	changeInputSyntaxSmtlib(newValue: boolean) {
		this.setState({inputSyntaxSmtlib: newValue});
	}
	changeOrientClauses(newValue: boolean) {
		this.setState({orientClauses: newValue});
	}
}