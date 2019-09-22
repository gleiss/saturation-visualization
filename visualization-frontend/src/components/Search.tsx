import * as React from 'react';

import { Dag } from '../model/dag';
import './Search.css';
import SatNode from '../model/sat-node';
import { assert } from '../model/util';
import { Clause } from '../model/unit';


type Props = {
  dag: Dag | null,
  onUpdateNodeSelection: (selection: number[]) => void
};
type State = {
  foundNodes: Array<SatNode>
};

export default class Search extends React.Component<Props, State> {

  state = {
    foundNodes: []
  };
  private searchField1 = React.createRef<HTMLInputElement>();
  private searchField2 = React.createRef<HTMLInputElement>();
  private searchField3 = React.createRef<HTMLInputElement>();

  render() {
    const {foundNodes} = this.state;

    return (
      <section className="component-search">
        <input
          type="text"
          ref={this.searchField1}
          placeholder="Search for nodes including literal"
          onKeyUp={this.search.bind(this)}
          disabled={this.props.dag === null}
        />
        <input
          type="text"
          ref={this.searchField2}
          placeholder="Search for nodes excluding literals"
          onKeyUp={this.search.bind(this)}
          disabled={this.props.dag === null}
        />
        <input
          type="text"
          ref={this.searchField3}
          placeholder="Search for nodes using inference rule"
          onKeyUp={this.search.bind(this)}
          disabled={this.props.dag === null}
        />
        <ul id="searchResults">
          {
            foundNodes.slice(0, 21).map(node => this.toListItem(node))
          }
          {
            foundNodes.length > 20 && this.getDisabledListItem()
          }
        </ul>
      </section>
    );
  }


  // SEARCH ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  search() {

    assert(this.props.dag !== null);

    assert(this.searchField1.current!);
    assert(this.searchField2.current!);
    assert(this.searchField3.current!);
    const searchString1 = this.searchField1.current!.value;
    const searchString2 = this.searchField2.current!.value;
    const searchString3 = this.searchField3.current!.value;

    // only perform search if at least one search string is non-empty
    if (searchString1 === "" && searchString2 === "" && searchString3 === "") {
      this.props.onUpdateNodeSelection([]);
      this.setState({
        foundNodes: []
      });
      return;
    }

    let candidates = Array.from(this.props.dag!.nodes.values());

    // find all clauses which contain a literal which matches the first search string
    if (searchString1 !== "") {
      const foundNodes = new Array<SatNode>();
  
      for (const node of candidates) {
        if (node.unit.type === "Clause") {
          const clause = node.unit as Clause;
        
          let foundLiteral = false;
          for (const literal of clause.premiseLiterals) {
            if(literal.toString(false).includes(searchString1)) {
              foundLiteral = true;
              break;
            }
          }
          if (!foundLiteral) {
            for (const literal of clause.conclusionLiterals) {
              if(literal.toString(true).includes(searchString1)) {
                foundLiteral = true;
                break;
              }
            }
          }
          if(foundLiteral) {
            foundNodes.push(node);
          }
        }
      }
      candidates = foundNodes;
    }

    // find all clauses which don't contain a literal which matches the second search string
    if (searchString2 !== "") {
      const foundNodes = new Array<SatNode>();
  
      for (const node of candidates) {
        if (node.unit.type === "Clause") {
          const clause = node.unit as Clause;
        
          let foundLiteral = false;
          for (const literal of clause.premiseLiterals) {
            if(literal.toString(false).includes(searchString2)) {
              foundLiteral = true;
              break;
            }
          }
          if (!foundLiteral) {
            for (const literal of clause.conclusionLiterals) {
              if(literal.toString(true).includes(searchString2)) {
                foundLiteral = true;
                break;
              }
            }
          }

          if(!foundLiteral) {
            foundNodes.push(node);
          }
        }
      }
      candidates = foundNodes;
    }

    // find all clauses which have been derived using an inference rule which matches the third search string
    if (searchString3 !== "") {
      const foundNodes = new Array<SatNode>();
  
      for (const node of candidates) {
        if (node.inferenceRule.includes(searchString3)) {
          foundNodes.push(node);
        }
      }
      candidates = foundNodes;
    }

    const nodesInActiveDag = this.props.dag!.computeNodesInActiveDag(Number.MAX_SAFE_INTEGER);
    const foundNodes = new Array<SatNode>();
    for (const node of candidates) {
      if (node.isFromPreprocessing || nodesInActiveDag.has(node.id)) {
        foundNodes.push(node);
      }
    }
    candidates = foundNodes;

    // order found clauses by length
    candidates.sort((node1: SatNode, node2: SatNode) => {
      const clause1 = node1.unit as Clause;
      const clause2 = node2.unit as Clause;
      return clause1.toString().length - clause2.toString().length
    });

    // select all found clauses
    this.props.onUpdateNodeSelection(candidates.map(node => node.id));
  
    // present search results
    this.setState({
      foundNodes: candidates
    });
  }

  toListItem = (node: SatNode) => {
    return <li key={node.id} onClick={() => this.props.onUpdateNodeSelection([node.id])}>{node.toString()}</li>;
  };

  getDisabledListItem = () => {
    return <li className="disabled-element">...</li>;
  };

}
