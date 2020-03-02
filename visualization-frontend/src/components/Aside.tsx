import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import './NodeMenu.css';
import NodeDetails from './NodeDetails';
import { Dag } from '../model/dag';
import { Literal } from '../model/literal';
import { assert } from '../model/util';
const icons = require('../resources/icons/all.svg') as string;

type Props = {
    message: string,
    mode: "proof" | "replay" | "iterative",
    tree: any | null,
    nodeSelection: number[],
    onUpdateNodeSelection: (selection: number[]) => void,
    onPoke: () => void,
    SatVisLayout: () => void,
    PobVisLayout: () => void,
    SMTLayout: () => void,
    JSONLayout:() => void,
    PobLemmasMap: {},
    ExprMap: {},
    layout: string,
    expr_layout: "SMT"|"JSON"
};
export default class Aside extends React.Component<Props, {}> {

    render() {
        let nodeDetails;
        console.log(this.props.mode)
        let refresh_button =
                <button
                    title="Poke"
                    onClick = { this.props.onPoke }
                >
                    <svg viewBox="0 0 24 24" className = "icon big" >
                        <use xlinkHref={ `${icons}#graph-undo` } />
                    </svg>
                </button>;

        if (this.props.nodeSelection.length === 1  && this.props.tree!=null) {
            let node = this.props.tree[this.props.nodeSelection[0]]
            // const node = this.props.tree[this.props.nodeSelection[0]];
            nodeDetails =
                <NodeDetails
                    node={ node }
                    PobLemmasMap = { this.props.PobLemmasMap }
                    ExprMap = { this.props.ExprMap }
                    layout = { this.props.layout }
                    expr_layout ={this.props.expr_layout}
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
                <article>
                    <section className="component-node-menu">{this.props.message}</section>
                    <section className="component-node-menu" >
                        { refresh_button }
                        <button
                        title = "SatVis"
                        onClick = { this.props.SatVisLayout }
                        >
                        <svg viewBox="0 0 24 24" className = "icon big" >
                            <use xlinkHref={ `${icons}#node-parents` } />
                        </svg>
                        </button>

                        <button
                            title = "PobVis"
                            onClick = { this.props.PobVisLayout }
                        >
                            <svg viewBox="0 0 24 24" className = "icon big" >
                                <use xlinkHref={ `${icons}#node-children` } />
                            </svg>
                        </button>
                        <button
                            title = "SMT"
                            onClick = { this.props.SMTLayout }
                        >
                            <svg viewBox="0 0 24 24" className = "icon big" >
                                <use xlinkHref={ `${icons}#node-children` } />
                            </svg>
                        </button>
                        <button
                            title = "JSON"
                            onClick = { this.props.JSONLayout }
                        >
                            <svg viewBox="0 0 24 24" className = "icon big" >
                                <use xlinkHref={ `${icons}#node-children` } />
                            </svg>
                        </button>
                    </section>
                </article>
                { nodeDetails }
            </aside>
        );
    }

}
