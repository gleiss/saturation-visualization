import React, {Component} from 'react';
import Main from "./components/Main";
import Form, {SliderForm} from "./components/Form";
import SlideWrapper from "./components/SlideWrapper";
import SlideValue from "./components/SlideValue";
import SlideContainer from "./components/SlideContainer";
import SubmitButton, {SmallSubmitButton} from "./components/SubmitButton";
import Aside from "./components/Aside";
import FormGroup from "./components/FormGroup";
import ButtonInput from "./components/ButtonInput";
import Card from "./components/Card";
import CardArticle from "./components/CardArticle";
import CardHeadline from "./components/CardHeadline";
import FakeForm from "./components/FakeForm";
import Button from "./components/Button";
import {SearchField, SearchResults} from "./components/Search";
import CardSection from "./components/CardSection";
import NodeDetails from "./components/NodeDetails";
import NodeId from "./components/NodeId";
import NodeRule from "./components/NodeRule";
import NodeClause from "./components/NodeClause";
import NodeCount from "./components/NodeCount";

class App extends Component {
  render() {
    return (
      <div>
        <Main>
          <section id="graph">
            <canvas></canvas>
          </section>
          <section>
            <SliderForm id="buttonForm" action="" method="post">
              <input id="historySelection"
                     type="hidden"
                     name="historySelection"/>
              <input id="historyMarkers"
                     type="hidden"
                     name="marked"/>
              <SmallSubmitButton type="submit" id="showPreviousStep" name="decrease" value="-"/>
              <SlideWrapper>
                <SlideValue id="slideValue" className="slide-value"></SlideValue>
                <SlideContainer id="slideContainer"></SlideContainer>
              </SlideWrapper>
              <SmallSubmitButton type="submit" id="showNextStep" name="increase" value="+"/>
            </SliderForm>
          </section>
        </Main>
        <Aside>
          <FormGroup className="spaced">
            <Form id="fileForm" action="" method="post" encType="multipart/form-data">
              <input type="hidden" id="fileUpload" name="file"/>
              <input type="file" id="fileSelector" className="hidden" onChange="uploadFile(this.files)"/>

              <ButtonInput id="uploadFileButton"
                           value="file"
                           title="Pick a new file"
                           onClick="chooseFile()"/>
            </Form>

            <Form action="" method="post">
              <input type="hidden" id="transformationSelection" name="selection"/>
              <input type="hidden" id="transformationMarkers" name="marked"/>

              <SubmitButton id="undoLastStep"
                            value="undo"
                            title="Undo last transformation"
                            name="undo"/>
              <SubmitButton id="selectUp"
                            disabled
                            value="up"
                            title="Render selection only (up)"
                            name="up"/>
              <SubmitButton id="selectDown"
                            disabled
                            value="down"
                            title="Render selection only (down)"
                            name="down"/>
            </Form>
          </FormGroup>

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
        </Aside>

      </div>
    );
  }
}

export default App;
