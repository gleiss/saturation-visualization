import styled from 'styled-components';

const Li = styled.li`
  margin: 0 -0.5rem;
  padding: 0 0.7rem;
  list-style: none;
  line-height: 1.5;
  font-size: 0.833rem;
  color: #343539;
  cursor: pointer;
  
  &:hover {
    background: #f4f5f7;
    color: #000;
    border-radius: 2px;
  }
  
  &:first-child {
    margin-top: 0.5rem;
  }
  
  &.disabled-element:hover {
    background: transparent;
  }
`;

export default Li;
