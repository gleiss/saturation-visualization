import {injectGlobal} from 'styled-components';

injectGlobal`
  html {
    height: 100%;
    width: 100%;
    font-family: 'Arial', 'Helvetica', sans-serif;
  }
  
  body {
    height: 100%;
    width: 100%;
    margin: 0;
    overflow: hidden;
    display: flex;
    background: #f4f5f7;
  }

  .hidden {
    display: none !important;
  }
  
  .spaced {
    margin-bottom: 1.5rem;
  }
  
  
  #uploadFileButton {
    background-image: url("../../../proof_visualization/view/static/svg/file-plus.svg");
  }
  
  #undoLastStep {
    background-image: url("../../../proof_visualization/view/static/svg/rotate-ccw.svg");
  }
  
  #undoLastStep:disabled {
    background-image: url("../../../proof_visualization/view/static/svg/rotate-ccw_disabled.svg");
  }
  
  #selectUp {
    background-image: url("../../../proof_visualization/view/static/svg/arrow-up.svg");
  }
  
  #selectUp:disabled {
    background-image: url("../../../proof_visualization/view/static/svg/arrow-up_disabled.svg");
  }
  
  #selectDown {
    background-image: url("../../../proof_visualization/view/static/svg/arrow-down.svg");
  }
  
  #selectDown:disabled {
    background-image: url("../../../proof_visualization/view/static/svg/arrow-down_disabled.svg");
  }
  
  #selectParents {
    background-image: url("../../../proof_visualization/view/static/svg/parents.svg");
  }
  
  #selectParents:disabled {
    background-image: url("../../../proof_visualization/view/static/svg/parents_disabled.svg");
  }
  
  #selectChildren {
    background-image: url("../../../proof_visualization/view/static/svg/children.svg");
  }
  
  #selectChildren:disabled {
    background-image: url("../../../proof_visualization/view/static/svg/children_disabled.svg");
  }
  
  #findCommonConsequences {
    background-image: url("../../../proof_visualization/view/static/svg/consequences.svg");
  }
  
  #findCommonConsequences:disabled {
    background-image: url("../../../proof_visualization/view/static/svg/consequences_disabled.svg");
  }
  
  #showNextStep {
    background-image: url("../../../proof_visualization/view/static/svg/plus.svg");
  }
  
  #showPreviousStep {
    background-image: url("../../../proof_visualization/view/static/svg/minus.svg");
  }
  
`;
