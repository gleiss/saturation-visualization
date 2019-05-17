import * as React from 'react';

import FormGroup from './FormGroup';
import {Form} from './Form';
import {SubmitButton} from './SubmitButton';
import Card from './Card';
import CardArticle from './CardArticle';
import CardHeadline from './CardHeadline';
import FakeForm from './FakeForm';
import Button from './Button';
import {SearchField, SearchResults} from './Search';
import CardSection from './CardSection';
import NodeDetails from './NodeDetails';
import NodeId from './NodeId';
import NodeRule from './NodeRule';
import NodeClause from './NodeClause';
import NodeCount from './NodeCount';


export default class NodeMenu extends React.Component {
  render() {
    return (
      <Card>
        <CardArticle>
          <CardHeadline>Select Nodes</CardHeadline>
          <FormGroup>
            <FakeForm>
              <Button id="selectParents"
                      disabled
                      title="Select parents"
                      onClick="selectParents()">A
              </Button>
              <Button id="selectChildren"
                      disabled
                      title="Select children"
                      onClick="selectChildren()">B
              </Button>
            </FakeForm>

            <Form action="" method="post">
              <input id="consequenceSelection" type="hidden" name="consequenceOrigins"/>
              <input id="consequenceMarkers" type="hidden" name="marked"/>

              <SubmitButton id="findCommonConsequences"
                            disabled
                            value="C"
                            title="Find common consequences"/>
            </Form>
          </FormGroup>
          <SearchField id="search"
                       className="sidebar-input spaced"
                       placeholder="Search for a node ..."
                       onKeyUp="search(this.value)"/>
          <SearchResults id="searchResults">
          </SearchResults>
        </CardArticle>
        <CardSection>
          <NodeDetails id="nodeDetails" className="hidden">
            <CardHeadline>Node <NodeId id="nodeDetailsId"></NodeId></CardHeadline>
            <NodeRule id="nodeDetailsRule"></NodeRule>
            <NodeClause id="nodeDetailsClause"></NodeClause>
          </NodeDetails>

          <NodeCount id="nodeInfo"><strong id="nodeCount">0 nodes</strong> selected</NodeCount>
        </CardSection>
      </Card>
    );
  }
}
