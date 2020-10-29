import FigmaPlugin from '../index';

export class VectorRenderer {
  root: FigmaPlugin;

  constructor(root: FigmaPlugin) {
    this.root = root;
  }

  drawPath(context, pos) {
    context.save();
    context.beginPath();
    context.translate(pos[0] + pos[2] / 2, pos[1] + pos[3] / 2);
    context.scale(pos[2] / pos[2], 1);
    context.arc(0, 0, pos[2] / 2, 0, Math.PI * 2, true);
    context.restore();
    context.closePath();
  }

  fill(context, pos, data, fill) {
    console.log('a kak', {data});
  }
}