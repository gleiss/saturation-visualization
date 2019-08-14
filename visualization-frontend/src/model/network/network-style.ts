export class EdgeColor {
  opacity: number;
  color: string;

  constructor(opacity: number, color: string) {
    this.opacity = opacity;
    this.color = color;
  }

}


export class Color {
  background: string;
  border: string;

  constructor(background: string, border: string) {
    this.background = background;
    this.border = border;
  }

}


export class ColorStyle {
  background: string;
  border: string;
  defaultStyle: Color;
  highlight: Color;
  markedStyle: Color;

  constructor(
    background: string,
    border: string,
    defaultStyle: Color,
    highlight: Color,
    markedStyle: Color
  ) {
    this.background = background;
    this.border = border;
    this.defaultStyle = defaultStyle;
    this.highlight = highlight;
    this.markedStyle = markedStyle;
  }

  get(key: string): Color {
    switch (key) {
      case 'markedStyle':
        return this.markedStyle;
      case 'highlight':
        return this.highlight;
      default:
        return this.defaultStyle;
    }
  }

}


export class FontStyle {
  color: string;
  multi: boolean;

  constructor(color: string) {
    this.color = color;
    this.multi = true;
  }

}
