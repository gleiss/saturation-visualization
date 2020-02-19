import * as React from 'react';
import { HashRouter as HashRouter, Route, Link } from "react-router-dom";
import { AppWrapper } from './AppWrapper'
import { Menu } from './Menu'
import { RouteComponentProps } from 'react-router';
type State = {
    problem: string,
    problemName: string,
    inputSyntax: "smtlib" | "log",
    spacerUserOptions: string,
    hideBracketsAssoc: boolean,
    nonStrictForNegatedStrictInequalities: boolean,
    orientClauses: boolean
}

export class AppRouter extends React.Component<{} & RouteComponentProps<{}>, State> {

    state: State = {
        problem: "",
        problemName: "",
        inputSyntax: "smtlib",
        spacerUserOptions: "fp.spacer.max_level=4 fp.spacer.dump_benchmarks=true fp.spacer.arith.solver=6",
        hideBracketsAssoc: true,
        nonStrictForNegatedStrictInequalities: true,
        orientClauses: true
    }

    render() {
        return (
            <HashRouter>
                <Route path="/" exact render={() => 
                    <Menu 
                    problem={this.state.problem}
                    problemName={this.state.problemName}
                    inputSyntax={this.state.inputSyntax}
                    spacerUserOptions={this.state.spacerUserOptions}
                    hideBracketsAssoc={this.state.hideBracketsAssoc}
                    nonStrictForNegatedStrictInequalities={this.state.nonStrictForNegatedStrictInequalities}
                    orientClauses={this.state.orientClauses}
                    onChangeProblem={this.changeProblem.bind(this)}
                    onChangeProblemName={this.changeProblemName.bind(this)}
                    onChangeInputSyntax={this.changeInputSyntax.bind(this)}
                    onChangeSpacerUserOptions={this.changeSpacerUserOptions.bind(this)}
                    onChangeHideBracketsAssoc={this.changeHideBracketsAssoc.bind(this)}
                    onChangeNonStrictForNegatedStrictInequalities={this.changeNonStrictForNegatedStrictInequalities.bind(this)}
                    onChangeOrientClauses={this.changeOrientClauses.bind(this)}
                    />
                }/>
                <Route path="/proof/" render={() => 
                    this.appComponent("proof", "")
                }/>
                <Route path="/replay/:exp_id" render={({match}) => 
                    this.appComponent("replay", match.params.exp_id)
                }/>
                <Route path="/iterative/" render={() => 
                    this.appComponent("iterative", "")
                }/>
            </HashRouter>
        );
    }

    appComponent(mode: "proof" | "replay" | "iterative", exp_path: string) {
        const inputSyntax = this.state.inputSyntax === "smtlib" ? "smtlib2" : this.state.inputSyntax;
        // const spacerUserOptions = `${this.state.spacerUserOptions} --input_syntax ${inputSyntax}`;
        const spacerUserOptions = `${this.state.spacerUserOptions}`;
        return <AppWrapper
        name={this.state.problemName}
        exp_path ={exp_path}
        mode={mode}
        problem={this.state.problem!}
        spacerUserOptions={spacerUserOptions}
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
    changeSpacerUserOptions(spacerUserOptions: string) {
        this.setState({spacerUserOptions: spacerUserOptions});
    }
    changeHideBracketsAssoc(newValue: boolean) {
        this.setState({hideBracketsAssoc: newValue});
	  }
	  changeNonStrictForNegatedStrictInequalities(newValue: boolean) {
		    this.setState({nonStrictForNegatedStrictInequalities: newValue});
	  }
	  changeInputSyntax(inputSyntax: "smtlib" | "log") {
		    this.setState({inputSyntax: inputSyntax});
	  }
	  changeOrientClauses(newValue: boolean) {
		    this.setState({orientClauses: newValue});
	  }
}
