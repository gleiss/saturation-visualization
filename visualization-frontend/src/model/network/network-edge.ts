import {EdgeColor} from './network-style';

export default class NetworkEdge {

  arrows: string;
  color: EdgeColor;
  from: number;
  to: number;

  constructor(arrows: string, color: EdgeColor, from: number, to: number) {
    this.arrows = arrows;
    this.color = color;
    this.from = from;
    this.to = to;
  }

}
