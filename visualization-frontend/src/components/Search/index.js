import styled from 'styled-components';

const SearchField = styled.input.attrs({
  type: 'text',
})`
  z-index: 20;
  position: relative;
  margin: 1rem 5px;
  padding: 0 0.5rem;
  width: calc(100% - 10px);
  box-sizing: border-box;
  height: 2rem;
  line-height: 2rem;
  background: transparent;
  border: solid 1px #ddd;
  box-shadow: inset 0 1px 2px 0 rgba(0, 0, 0, .07);
  outline: none;
  
  &:focus + #searchResults,
  &:active + #searchResults {
    box-shadow: 1px 3px 30px 0 rgba(0, 0, 0, .25);
  }
`;

const SearchResults = styled.ul`
  background: #fff;
  position: absolute;
  margin: calc(-3rem - 5px) 0 0;
  padding: calc(1.5rem + 10px) 0.5rem 0.5rem;
  overflow: hidden;
  border-radius: 5px;
  width: 225px;
  z-index: 10;
  
  &:hover,
  &:focus,
  &:active {
    box-shadow: 1px 3px 30px 0 rgba(0, 0, 0, .25);
  }
  
  &.focused {
    box-shadow: 1px 3px 30px 0 rgba(0, 0, 0, .25);
  }
`;

export {SearchField, SearchResults};
