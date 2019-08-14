import {ColorStyle, FontStyle} from './network-style';

export default class NetworkNode {

  id: number;
  color: ColorStyle;
  font: FontStyle;
  label: string;
  rule: string;
  shape: string;
  x: number;
  y: number;

  constructor(
    id: number,
    color: ColorStyle,
    font: FontStyle,
    label: string,
    rule: string,
    shape: string,
    x: number,
    y: number
  ) {
    this.id = id;
    this.color = color;
    this.font = font;
    this.label = label;
    this.rule = rule;
    this.shape = shape;
    this.x = x;
    this.y = y;
  }

}
