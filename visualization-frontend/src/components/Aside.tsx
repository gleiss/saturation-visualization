import * as React from 'react';

import GraphMenu from './GraphMenu';
import NodeCard from './NodeCard';
import NodeDetails from './NodeDetails';
import { Dag } from '../model/dag';
import { Literal } from '../model/literal';
import { assert } from '../model/util';


type Props = {
    tree: any | null,
    nodeSelection: number[],
    onUpdateNodeSelection: (selection: number[]) => void,
};
export default class Aside extends React.Component<Props, {}> {

    render() {
        let nodeDetails;
        if (this.props.nodeSelection.length === 1) {
            let node
            for (const n of this.props.tree){
                if (n.nodeId==this.props.nodeSelection[0]){
                    node = n;
                    break;
                }
            }
            // const node = this.props.tree[this.props.nodeSelection[0]];
            nodeDetails =
                <NodeDetails
            node={ node }
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
                { nodeDetails }
            </aside>
        );
    }

}
