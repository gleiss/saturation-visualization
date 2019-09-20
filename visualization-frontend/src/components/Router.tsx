import * as React from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import App from './App'
import { Menu } from './Menu'

type State = {
	problem: string;
}

export class AppRouter extends React.Component<{}, State> {

	state: State = {
		problem: ""
	}

	render() {
		return (
			<Router>
				<Route path="/" exact render={() => 
					<Menu onSetProblem={this.setProblem.bind(this)}/>
				}/>
				<Route path="/proof/" render={() => 
					<App mode="proof" problem={this.state.problem!}/>
				}/>
				<Route path="/saturation/" render={() => 
					<App mode="saturation" problem={this.state.problem!}/>
				}/>
				<Route path="/manualcs/" render={() => 
					<App mode="manualcs" problem={this.state.problem!}/>
				}/>                
			</Router>
		);
	}

	setProblem(problem: string) {
		this.setState({problem: problem});
	}
}