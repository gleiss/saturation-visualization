import * as React from 'react';

import { Dag } from '../model/dag';
import Slider from './Slider';
import Graph from './Graph';
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');

type Props = {
    mode: "proof" | "replay" | "iterative",
    tree: any,
    onNodeSelectionChange: (selection: number[]) => void,
    nodeSelection: number[],
    historyLength: number,
    currentTime: number,
    onCurrentTimeChange: (newState: number) => void,
    layout: string,
    PobLemmasMap: any,
};
export default class Main extends React.Component<Props, {}> {

    // TODO: remove this, after supporting button clicks in Aside while the modal is active
    componentDidMount() {
    }

    render() {
        return (
                <main>
                <Graph
            tree= { this.props.tree }
            onNodeSelectionChange={this.props.onNodeSelectionChange}
            nodeSelection={this.props.nodeSelection}
            currentTime = {this.props.currentTime}
            layout = {this.props.layout}
            PobLemmasMap = {this.props.PobLemmasMap}
                />
                <Slider
            historyLength={this.props.historyLength}
            currentTime={this.props.currentTime}
            onCurrentTimeChange={this.props.onCurrentTimeChange}
            enabled={true}
                />
                </main>
        );
    }

}
