import * as React from 'react';

import FormGroup from './FormGroup';
import {Form} from './Form';
import ButtonInput from './ButtonInput';
import {SubmitButton} from './SubmitButton';


export default class GraphMenu extends React.Component {
  render() {
    return (
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
    );
  }
}
