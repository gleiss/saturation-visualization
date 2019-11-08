import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';
import { Dag } from '../model/dag';
import { Literal } from '../model/literal';
import { assert } from '../model/util';
const icons = require('../resources/icons/all.svg') as string;

type Props = {
    tree: any | null,
    nodeSelection: number[],
    onUpdateNodeSelection: (selection: number[]) => void,
    SatVisLayout: () => void,
    PobVisLayout: () => void,
    PobLemmasMap: {},
    ExprMap: {},
    layout: string,
};
export default class Aside extends React.Component<Props, {}> {

    render() {
        let nodeDetails;
        if (this.props.nodeSelection.length === 1) {
            let node = this.props.tree[this.props.nodeSelection[0]]
            // const node = this.props.tree[this.props.nodeSelection[0]];
            nodeDetails =
                <NodeDetails
            node={ node }
            PobLemmasMap = {this.props.PobLemmasMap}
            ExprMap = {this.props.ExprMap}
            layout = {this.props.layout}
                />;
        } else {
            nodeDetails =
                <section className={ 'component-node-details overview' }>
                <small id="nodeInfo" > <strong>{`${this.props.nodeSelection.length} nodes`
                                               } </strong> selected</small >
                </section>
        }
        return(
                <aside>
                <section className="component-node-menu">

                <button
            title="SatVis"
            onClick={this.props.SatVisLayout}
                >
                <svg viewBox="0 0 24 24" className="icon big">
                <use xlinkHref={`${icons}#node-parents`}/>
                </svg>
                </button>

                <button
            title="PobVis"
            onClick={this.props.PobVisLayout}
                >
                <svg viewBox="0 0 24 24" className="icon big">
                <use xlinkHref={`${icons}#node-children`}/>
                </svg>
                </button>

                </section>
                { nodeDetails }
            </aside>
        );
    }

}
