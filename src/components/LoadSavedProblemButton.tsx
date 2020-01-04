import * as React from 'react';
import {useHistory} from 'react-router-dom';

const icons = require('../resources/icons/all.svg') as string;

export default function LoadSavedProblemButton(props) {
  const history = useHistory();
  const fileUpload = React.createRef<HTMLInputElement>();

  function loadSavedProblemData(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files !== null && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      // callback which will be executed when readAsText is called
      reader.onloadend = () => {
        const text = (reader.result ? reader.result : '') as string;
        props.onLoadSavedProblemData(text);
        history.push('/saved/');
      };
      reader.readAsText(file);
    }
  }

  return (
    <section className="load-component">
      <button
        className="load-button"
        type="button"
        onClick={() => fileUpload.current && fileUpload.current.click()}>
        <svg viewBox="0 0 24 24" className="icon">
          <use xlinkHref={`${icons}#save-upload`}/>
        </svg>
        <span>Load saved proof</span>
      </button>
      <input
        ref={fileUpload}
        type="file"
        onChange={loadSavedProblemData}
      />
    </section>
  );
}
