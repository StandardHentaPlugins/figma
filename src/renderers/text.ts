import FigmaPlugin from '../index';

export class TextRenderer {
  root: FigmaPlugin;

  constructor(root: FigmaPlugin) {
    this.root = root;
  }

  truncate(str, n) {
    return (str.length > n) ? `${str.substr(0, n - 1)}…` : str;
  }

  fill(context, pos, data, fill) {
    let x = pos[0];
    let y = pos[1];
  
    context.textAlign = data.style.textAlignHorizontal.toLowerCase();
    context.textBaseline = { CENTER: 'middle', TOP: 'top', BOTTOM: 'bottom' }[data.style.textAlignVertical];

    if (context.textAlign === 'center') {
      x += pos[2] / 2;
    }

    if (context.textAlign === 'right') {
      x += pos[2];
    }

    if (context.textBaseline === 'middle') {
      y += pos[3] / 2;
    }

    if (context.textBaseline === 'bottom') {
      y += pos[3];
    }

    const fontName = data.style.fontPostScriptName ? data.style.fontPostScriptName.replace('-', ' ') : data.style.fontFamily;
    context.font = `${data.style.fontSize}px ${fontName}`;
    context.fillText(data.max ? this.truncate(data.characters, data.max) : data.characters, x, y);
  }
}