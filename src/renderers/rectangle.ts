import FigmaPlugin from '../index';

export class RectangleRenderer {
  root: FigmaPlugin;

  constructor(root: FigmaPlugin) {
    this.root = root;
  }

  calculateProgress(pos, data) {
    if (data.right === 0 || data.bottom === 0 || data.left === 0 || data.top === 0) {
      return [0, 0, 0, 0];
    }

    const newPos = [ ...pos ];
    newPos[0] += data.right ? ((data.max || newPos[2]) * data.right) : 0;
    newPos[1] += data.bottom ? ((data.max || newPos[3]) * data.bottom) : 0;
    newPos[2] *= data.bottom || data.top || 1;
    newPos[3] *= data.left || data.right || 1;

    return newPos;
  }

  roundRect(ctx, x, y, width, height, radius: number | {} = 0) {
    const cRadius = typeof radius === 'number'
      ? {tl: radius, tr: radius, br: radius, bl: radius}
      : { tl: 0, tr: 0, br: 0, bl: 0, ...radius };

    ctx.beginPath();
    ctx.moveTo(x + cRadius.tl, y);
    ctx.lineTo(x + width - cRadius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cRadius.tr);
    ctx.lineTo(x + width, y + height - cRadius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cRadius.br, y + height);
    ctx.lineTo(x + cRadius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cRadius.bl);
    ctx.lineTo(x, y + cRadius.tl);
    ctx.quadraticCurveTo(x, y, x + cRadius.tl, y);
    ctx.closePath();
  }

  fill(context, pos, data, fill) {
    const cPos = data.progress ? this.calculateProgress(pos, data.progress) : pos;
    if (fill.type === 'IMAGE') {
      const image = data.image || this.root.images[fill.imageRef];
      console.log(image, fill.imageRef)
      context.drawImage(image, ...cPos);
      return;
    }

    const round = data.rectangleCornerRadii ? { tl: data.rectangleCornerRadii[0], tr: data.rectangleCornerRadii[1], br: data.rectangleCornerRadii[2], bl: data.rectangleCornerRadii[3] } : 0;
    this.roundRect(context, cPos[0], cPos[1], cPos[2], cPos[3], round);
    context.fill();
  }
}