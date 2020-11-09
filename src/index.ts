import * as Figma from 'figma-js';
import { createCanvas, loadImage } from 'canvas';
import { RectangleRenderer } from './renderers/rectangle';
import { EllipseRenderer } from './renderers/ellipse';
import { VectorRenderer } from './renderers/vector';
import { TextRenderer } from './renderers/text';
import { FigmaCache } from './cache';
import * as crypto from 'crypto';

export default class FigmaPlugin {
  henta: any;
  client: Figma.ClientInterface;
  cache = new FigmaCache(this);
  imagesQueue = new Set();
  images = {};
  renderers = {
    ['RECTANGLE']: new RectangleRenderer(this),
    ['ELLIPSE']: new EllipseRenderer(this),
    ['VECTOR']: new VectorRenderer(this),
    ['TEXT']: new TextRenderer(this)
  };

  constructor(henta) {
    this.henta = henta;
  }

  async preInit() {
    this.client = Figma.Client({
      personalAccessToken: this.henta.config.private.figmaToken
    });

    this.cache.preInit(this.henta);
  }

  start() {
    this.cache.save();
  }

  async loadFromNet(fileId, slug) {
    this.henta.log(`Загружаю Figma компонент: ${slug}...`);
    const template: any = await this.client.file(fileId)
      .then(v => v.data.document.children[0]['children'].find(v => v.name === slug));

    const { images: allImages } = await this.client.fileImageFills(fileId).then(v => v.data.meta);

    // Find all refs
    const allRefs = [];
    const findRefs = node => {
      allRefs.push(...node.fills.filter(v => v.imageRef).map(v => v.imageRef));
      if (node.children) node.children.forEach(findRefs);
    }

    findRefs(template);
    const images: any[] = Object.entries(allImages).filter(v => allRefs.includes(v[0]));

    this.henta.log(`Загрузка изображений (${images.length} шт.)`);
    for (let i = 0; i < images.length; i++) {
      const v = images[i];
      this.images[v[0]] = await loadImage(v[1]);
      this.henta.log(`[${v[0]}] Загружено ${i + 1}/${images.length} (${Math.floor((i+1) / images.length * 100)}%)`);
    }
    await Promise.all(images.map(async (v: any) => { this.images[v[0]] = await loadImage(v[1]) }));

    this.henta.log(`Figma компонент загружен: ${slug}.`);
    this.optimize(template);
    this.cache.data.templates.push({ fileId, slug, ...template });
    this.cache.changes = true;
    return template;
  }

  optimize(template) {
    const staticParts = template.children.filter(v => v.name.startsWith('$static'));
    staticParts.forEach(v => {
      const imageRef = crypto.randomBytes(16).toString('hex');
      this.images[imageRef] = this.draw(v, {});
      v.fills = [{ type: 'IMAGE', imageRef }];
      v.type = 'RECTANGLE';
      v.children = [];
    });
  }

  async prepare(fileId, slug) {
    const result = this.cache.data.templates.find(v => v.fileId === fileId && v.slug === slug) || await this.loadFromNet(fileId, slug);
    result.draw = (params) => this.draw(result, params);
    result.drawToCanvas = (canvas, params) => this.drawToCanvas(result, canvas, params);

    return result;
  }

  loadImage(name) {
    return loadImage(`assets/images/${name}`);
  }

  draw(template, params) {
    const canvas = createCanvas(template.absoluteBoundingBox.width, template.absoluteBoundingBox.height);
    this.drawToCanvas(template, canvas, params);

    return canvas;
  }

  drawToCanvas(template, canvas, params, rawRootPos = null) {
    const rootPos = rawRootPos || template.absoluteBoundingBox;
    const data = template.name.startsWith('#') && params[template.name.substring(1)];
    this.drawComponent(template, canvas, data, rootPos);

    if (template.children) {
      template.children.forEach(v => this.drawToCanvas(v, canvas, params, rootPos));
    }
  }

  drawComponent(component, canvas, data = {}, rootPos) {
    if (component.visible === false) {
      return;
    }
  
    const pos = [
      component.absoluteBoundingBox.x - rootPos.x,
      component.absoluteBoundingBox.y - rootPos.y,
      component.absoluteBoundingBox.width,
      component.absoluteBoundingBox.height
    ];

    const renderer = this.renderers[component.type];
    if (!renderer) {
      return;
    }

    const context = canvas.getContext('2d');
    component.fills.forEach(v => {
      this.applyFill(context, v);
      renderer.fill(context, pos, { ...component, ...data }, v);
    });
  }

  applyFill(context, fill) {
    context.globalAlpha = fill.opacity || 1;
    switch(fill.type) {
      case 'SOLID':
        const { r, g, b, a } = fill.color;
        context.fillStyle = `rgba(${Math.floor(r * 256)}, ${Math.floor(g * 256)}, ${Math.floor(b * 256)}, ${a})`;
        break;
      case 'IMAGE':
        context.fillStyle = 'black';
        break;
      default:
        context.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 1)`;
    }
  }
}
