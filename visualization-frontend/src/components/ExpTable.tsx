import * as React from 'react';
import '../styles/NodeMenu.css';
import {Link} from 'react-router-dom';

const icons = require('../resources/icons/all.svg') as string;

type Props = {
};
type State = {
    isFetching: boolean,
    exps: any[],
}

export default class ExpTable extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            isFetching: false,
            exps: []
        };
    }

    async componentDidMount() {
        await this.fetchExps();
        // this.timer = setInterval(() => this.fetchUsers(), 5000);
    }

    render() {
        return (
                <div>
                {this.state.exps.map((item, index) => (
                        <h5 key = {item.name}><Link to={{pathname: `/replay/${item.name}`}} >{item.name}</Link> ${item.done}</h5>
                ))}
                <p>{this.state.isFetching ? 'Fetching experiments...' : ''}</p>
                </div>
        )
    }
    async fetchExps() {
        this.setState({
            isFetching: true,
        });

        const fetchedJSON = await fetch('http://localhost:5000/spacer/fetch_exps', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }, body : ""
        });

        try {
            const json = await fetchedJSON.json();
            console.log(json)
            this.setState({isFetching: false, exps: json.exps_list})
        } catch (error) {
            if (error.name === "SatVisAssertionError") {
                throw error;
            }
            this.setState({
                exps: []
            });
        }
    }


}
