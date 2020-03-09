import * as React from 'react';
import { Component } from 'react';

import Main from './Main';
import Aside from './Aside';
import '../styles/App.css';
import { assert } from '../model/util';
import {toReadable} from "../helpers/readable";
import {buildExprMap, buildPobLemmasMap} from "../helpers/network";

type Props = {
    name: string,
    exp_path: string,
    mode: "proof" | "replay" | "iterative",
    problem: string,
    spacerUserOptions: string,
    hideBracketsAssoc: boolean,
    nonStrictForNegatedStrictInequalities: boolean,
    orientClauses: boolean,
    varNames: string
};

/* Invariant: the state is always in one of the following phases
 *    "loaded": A dag is loaded. Clause selection is not possible. dags, nodeSelection and currentTime hold meaningful values.
 *    "loaded selected": Same as "loaded", but clause selection is possible.
 *    "waiting": Waiting for answer from Vampire server. message holds a meaningful value.
 *    "layouting": Layouting a dag. message holds a meaningful value.
 *    "error": Some error occured. message holds a meaningful value.
 */
type State = {
    exp_path: string,
    state: "loaded" | "loaded iterative" | "waiting" | "layouting" | "error",
    trees: any[],
    runCmd: string,
    message: string,
    nodeSelection: number[],
    currentTime: number,
    layout: string,
    expr_layout: "SMT" | "JSON",
    PobLemmasMap: {},
    ExprMap: {},
    multiselect: boolean
}

class App extends Component<Props, State> {

    state: State = {
        exp_path: this.props.exp_path,
        state: "waiting",
        trees: [],
        runCmd: "Run command:",
        message: "",
        nodeSelection: [],
        currentTime: 0,
        layout: "PobVis",
        expr_layout: "SMT",
        PobLemmasMap: {},
        ExprMap: {},
        multiselect: false
    };

    async componentDidMount() {
        if(this.props.mode === "iterative"){
            // call Vampire on given input problem
            await this.runSpacer(this.props.problem, this.props.spacerUserOptions, this.props.mode);
        }
        else{
            await this.poke();
        }
    }

    async poke() {
        console.log("poking...")
        this.setState({
            state: "waiting",
            message: "Poking Spacer...",
        });

        const fetchedJSON = await fetch('http://localhost:5000/spacer/poke', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }, body : JSON.stringify({
                exp_path: this.state.exp_path,
            })
        });

        try {
            const json = await fetchedJSON.json();
            console.log("backend response:", json)
            if (json.status === "success") {
                // await VizWrapper.layoutDag(dag, true);
                let tree = json.nodes_list;
                for (let i = 0; i < Object.keys(tree).length; i++){
                    tree[i].expr = toReadable(tree[i].expr, this.props.varNames);
                }
                const state = "loaded";
                const PobLemmasMap = buildPobLemmasMap(tree);
                const ExprMap = buildExprMap(tree);
                this.setState({
                    trees: [tree],
                    runCmd: json.run_cmd,
                    message: "Spacer is "+json.spacer_state,
                    state: state,
                    PobLemmasMap: PobLemmasMap,
                    ExprMap: ExprMap,
                });
                console.log("state is set")
            } else {
                assert(json.status === "error");
                const errorMessage = json.message;
                assert(errorMessage !== undefined && errorMessage !== null);
                this.setState({
                    state: "error",
                    message: errorMessage,
                });
            }
        } catch (error) {
            if (error.name === "SatVisAssertionError") {
                throw error;
            }
            this.setState({
                state: "error",
                message: `Error: ${error["message"]}`,
            });
        }
    }

    async runSpacer(problem: string, spacerUserOptions: string, mode: "proof" | "replay" | "iterative") {
        this.setState({
            state: "waiting",
            message: "Waiting for Spacer...",
        });

        const fetchedJSON = await fetch('http://localhost:5000/spacer/start_iterative', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.props.name,
                file: problem,
                spacerUserOptions: spacerUserOptions
            })
        });

        try {
            const json = await fetchedJSON.json();
            console.log("backend response:", json)
            if (json.status === "success") {
                // await VizWrapper.layoutDag(dag, true);
                let tree = json.nodes_list;
                for (let i = 0; i < Object.keys(tree).length; i++){
                    tree[i].expr = toReadable(tree[i].expr, this.props.varNames);
                }
                const state = (mode === "iterative" && json.spacer_state === "running") ? "loaded iterative" : "loaded";
                const PobLemmasMap = buildPobLemmasMap(tree);
                const ExprMap = buildExprMap(tree);
                const message = "Hit Poke to update graph";
                this.setState({
                    exp_path: json.exp_name,
                    trees: [tree],
                    message: message,
                    state: state,
                    PobLemmasMap: PobLemmasMap,
                    ExprMap: ExprMap,
                });
            } else {
                assert(json.status === "error");
                const errorMessage = json.message;
                assert(errorMessage !== undefined && errorMessage !== null);
                this.setState({
                    state: "error",
                    message: errorMessage,
                });
            }
        } catch (error) {
            if (error.name === "SatVisAssertionError") {
                throw error;
            }
            this.setState({
                state: "error",
                message: `Error: ${error["message"]}`,
            });
        }
    }

    updateNodeSelection(nodeSelection: number[]) {
        if (this.state.multiselect) {
            let tempNodeSelection = this.state.nodeSelection.slice(this.state.nodeSelection.length-1).concat(nodeSelection);
            this.setState({nodeSelection: tempNodeSelection});
        } else {
            this.setState({nodeSelection: nodeSelection});
        }
    }


    updateCurrentTime(currentTime: number) {
        const trees = this.state.trees
        assert(trees.length > 0);
        this.setState({
            currentTime: currentTime
        });
    }

    setPobVisLayout(){
        this.setState({ layout: "PobVis" })
    }
    setSatVisLayout(){
        this.setState({ layout: "SatVis" })
    }
    setMultiSelect() {
        if (this.state.multiselect) {
            if (this.state.nodeSelection.length > 0) {
                this.setState({
                    nodeSelection: [this.state.nodeSelection[this.state.nodeSelection.length - 1]]
                });
            }
            else {
                this.setState({
                    message: "Hit Poke to update graph"
                })
            }
        } else {
            this.setState({
                message: "Select Up to 2 nodes"
            });
        }
        this.setState({
            multiselect: !this.state.multiselect
        });
    }
    setSMTLayout(){
        this.setState({ expr_layout: "SMT" })
    }
    setJSONLayout(){
        this.setState({ expr_layout: "JSON" })
    }
    render() {
        const {
            state,
            trees,
            runCmd,
            message,
            nodeSelection,
            currentTime,
            layout,
            expr_layout,
            PobLemmasMap,
            ExprMap
        } = this.state;
        let tree;
        let main;
        if (state === "loaded") {
            assert(trees.length > 0);
            tree = trees[trees.length - 1];
            const hL = Object.keys(tree).length;
            main = (
                <Main
                    mode = { this.props.mode }
                    runCmd = {runCmd}
                    tree = { tree }
                    onNodeSelectionChange = { this.updateNodeSelection.bind(this) }
                    nodeSelection = { nodeSelection }
                    historyLength = { hL }
                    currentTime = { currentTime }
                    onCurrentTimeChange = { this.updateCurrentTime.bind(this) }
                    layout = { layout }
                    PobLemmasMap = { PobLemmasMap }
                />
            );
        } else {
            main = (
                <main>
                    <section className= "slider-placeholder" />
                </main>
            );
        }
        return (
                <div className= "app" >
                { main }
                <Aside
                    message = {message}
                    mode = { this.props.mode }
                    tree = { tree }
                    nodeSelection = { nodeSelection }
                    onUpdateNodeSelection = { this.updateNodeSelection.bind(this) }
                    onPoke = {this.poke.bind(this)}
                    SatVisLayout = { this.setSatVisLayout.bind(this) }
                    PobVisLayout = { this.setPobVisLayout.bind(this) }
                    MultiSelectMode= { this.setMultiSelect.bind(this) }
                    SMTLayout = { this.setSMTLayout.bind(this) }
                    JSONLayout = { this.setJSONLayout.bind(this) }
                    PobLemmasMap = { PobLemmasMap }
                    ExprMap = { ExprMap }
                    layout = { layout }
                    expr_layout ={expr_layout}
                />
                </div>
        );

    }

}

export default App;
