import * as React from 'react';
import './NavigationBar.css';

const icons = require('../resources/icons/all.svg') as string;

type Props = {
  name: string
}

export class NavigationBar extends React.Component<Props, {}> {

  render() {
    return (
      <nav id="navigationBar">
        <button onClick={() => history.back()}>
          <svg viewBox="0 0 24 24" className="icon">
            <use xlinkHref={`${icons}#nav-back`}/>
          </svg>
					<span>Back</span>
        </button>
        <small>{this.props.name}</small>
        <button id="saveButton">
          <svg viewBox="0 0 24 24" className="icon">
            <use xlinkHref={`${icons}#save-download`}/>
          </svg>
					<span>Save</span>
        </button>
      </nav>
    )
  }
}