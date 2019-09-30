import * as React from 'react';
import './NavigationBar.css';

type Props = {
	name: string
}

export class NavigationBar extends React.Component<Props, {}> {

	render() {
		return (
			<nav id="navigationBar">
				<button onClick={() => history.back()}>Back</button>
				<span>{this.props.name}</span>
			</nav>
		)
	}
}