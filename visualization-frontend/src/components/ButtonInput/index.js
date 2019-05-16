import styled from 'styled-components';

const ButtonInput = styled.input.attrs({
  type: 'button',
})`
  height: 50px;
  width: 50px;
  margin: 0 5px;
  border: none;
  border-radius: 2px;
  background-color: #d4d8d9;
  background-repeat: no-repeat;
  background-position: center;
  color: transparent;
  
  &:hover {
    box-shadow: 1px 3px 10px 0 rgba(0, 0, 0, .1);
  }
  
  &:focus {
    outline: none;
  }
  
  &:active {
    box-shadow: inset 1px 3px 8px 2px rgba(0, 0, 0, .1);
    outline: none;
  }
  
  &:disabled {
    background-color: #e6ebef;
    box-shadow: none;
    color: transparent;
  }
`;

export default ButtonInput;
