import { createCanvas } from 'canvas';
import { promises as fs, createWriteStream } from 'fs';
import FigmaPlugin from '.';

export interface CacheData {
  images: string[];
  templates: any[];
}

export class FigmaCache {
  root: FigmaPlugin;
  data: CacheData;
  changes = false;

  constructor(root: FigmaPlugin) {
    this.root = root;
  }

  async preInit(henta) {
    this.data = await henta.util.load('cache/figma/data.json').catch(() => ({ images: [], templates: [] }));
    await Promise.all(this.data.images.map(async v => {
      this.root.images[v] = await this.root.loadImage(`../../cache/figma/${v}.png`);
    }));
  }

  async save() {
    if (!this.changes) {
      return;
    }

    this.changes = false;
    this.root.henta.log('Кэширование Figma компонентов...');
    await fs.mkdir('cache/figma', { recursive: true });

    // Find all refs
    const allRefs = [];
    const findRefs = node => {
      allRefs.push(...node.fills.filter(v => v.imageRef).map(v => v.imageRef));
      if (node.children) node.children.forEach(findRefs);
    }

    this.data.templates.forEach(findRefs);
    const imagesToSave: any[] = Object.entries(this.root.images).filter(v => allRefs.includes(v[0]));
    await Promise.all(imagesToSave.map(([k, v]) => new Promise((resolve, reject) => {
      const canvas = createCanvas(v.width, v.height);
      canvas.getContext('2d').drawImage(v, 0, 0);
      const out = createWriteStream(`cache/figma/${k}.png`);
      canvas.createPNGStream().pipe(out);
      out.on('finish', resolve);
      out.on('error', reject);
    })));

    this.data.images = imagesToSave.map(v => v[0]);
    await fs.writeFile('cache/figma/data.json', JSON.stringify(this.data));
    this.root.henta.log('Figma компоненты сохранены...');
  }
}