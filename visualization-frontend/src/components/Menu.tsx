import * as React from 'react';
import { Link } from "react-router-dom";
import './Menu.css';

type Props = {
	onSetProblem: (problem: string) => void
}
type State = {
	problem: string
};

export class Menu extends React.Component<Props, State> {

	private fileUpload = React.createRef<HTMLInputElement>();

	state: State = {
		problem: ""
	  };

	render() {
		return (
			<section className="component-menu">
				<h1>Vampire Saturation Visualization</h1>
				<input
					ref={this.fileUpload}
					type="file"
					onChange={this.uploadEncoding.bind(this)}
				/>
				<button title="Pick a new file" onClick={this.chooseFile.bind(this)}>
					Upload
				</button>
				<textarea value={this.state.problem} onChange={this.handleTextAreaChange.bind(this)}></textarea>
				<h3>Options:</h3>
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
				this.setState({problem: text});
				this.props.onSetProblem(text);
			};	
			reader.readAsText(file);
		}
	}

	handleTextAreaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		const newValue = event.target.value;
		this.setState({problem: newValue});
		this.props.onSetProblem(newValue);
	}
}
