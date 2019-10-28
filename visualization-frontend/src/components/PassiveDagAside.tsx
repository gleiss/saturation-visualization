import * as React from 'react';

import { Dag } from '../model/dag';
import { Literal } from '../model/literal';
import { assert } from '../model/util';
import { NodeDetailsWrapper } from './NodeDetailsWrapper';

const icons = require('../resources/icons/all.svg') as string;


type Props = {
  dag: Dag,
  currentTime: number,
  nodeSelection: number[],
  onUpdateNodeSelection: (selection: number[]) => void,
  onLiteralOrientationChange: (nodeId: number, oldPosition: ["premise" | "conclusion" | "context", number], newPosition: ["premise" | "conclusion" | "context", number]) => void,
  onLiteralRepresentationChange: (nodeId: number, literal: Literal) => void
  onSelectButtonPressed: () => void,
};
export class PassiveDagAside extends React.Component<Props, {}> {

  render() {
    assert(this.props.dag.isPassiveDag);
    assert(this.props.dag.styleMap !== null);
    const selectClauseButtonEnabled = this.props.nodeSelection.length === 1 && this.props.dag.styleMap!.get(this.props.nodeSelection[0]) === "passive";

    return (
      <aside>
        <section className="component-graph-menu">
          <button title="Select clauses"
                  disabled={!selectClauseButtonEnabled}
                  onClick={() => { this.props.onSelectButtonPressed();}}>
            <svg viewBox="0 0 24 24" className="icon big">
              <use xlinkHref={`${icons}#graph-s`}/>
            </svg>
          </button>
        </section>
        <NodeDetailsWrapper
          dag={this.props.dag}
          nodeSelection={this.props.nodeSelection}
          currentTime={this.props.currentTime}
          onLiteralOrientationChange={this.props.onLiteralOrientationChange}
          onLiteralRepresentationChange={this.props.onLiteralRepresentationChange}
        />
      </aside>
    );
  }

}
