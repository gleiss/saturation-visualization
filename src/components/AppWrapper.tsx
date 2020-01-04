import * as React from 'react';
import {NavigationBar} from './NavigationBar';
import App from './App';
import './AppWrapper.css';

type Props = {
  name: string,
  problem: string,
  vampireUserOptions: string,
  mode: 'proof' | 'saturation' | 'manualcs'
  hideBracketsAssoc: boolean,
  nonStrictForNegatedStrictInequalities: boolean,
  orientClauses: boolean,
  logging: boolean
};

export class AppWrapper extends React.Component<Props, {}> {

  private app = React.createRef<App>();

  render() {
    return (
      <div id="appWrapper">
        <NavigationBar
          name={this.props.name}
          onSave={() => this.save()}
        />
        <App ref={this.app}
             problem={this.props.problem}
             vampireUserOptions={this.props.vampireUserOptions}
             mode={this.props.mode}
             hideBracketsAssoc={this.props.hideBracketsAssoc}
             nonStrictForNegatedStrictInequalities={this.props.nonStrictForNegatedStrictInequalities}
             orientClauses={this.props.orientClauses}
             logging={this.props.logging}
        />
      </div>
    )
  }

  save() {
    if (!this.app.current) {
      return;
    }
    const saveData = this.app.current.serialize();
    const element = document.createElement('a');
    const file = new Blob([saveData], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = this.generateFilename();
    document.body.appendChild(element);
    element.click();
  }

  private generateFilename(): string {
    const prefix = (this.props.name || '').split('.')[0];
    return `${prefix || 'satvis'}-saved.txt`
  }

}

  