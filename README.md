# HENTA Плагин: common/figma [![Build Status](https://travis-ci.com/StandardHentaPlugins/figma.svg?branch=master)](https://travis-ci.com/StandardHentaPlugins/figma)
Рендер FIGMA шаблонов в Вашем боте

```js
const figmaPlugin = henta.getPlugin('common/figma');
```

## Настройка
В файле private.json указывается Ваш токен.
```json
"figmaToken": "..."
```

## Использование
```js
  const figmaPlugin = henta.getPlugin('common/figma');
  const liveCover = figmaPlugin.prepare('file-id', 'live-cover');

  const canvas = liveCover.draw({
    myText: 'Hello world'
  });
  // Or
  liveCover.drawToCanvas(canvas, {
    myText: 'Hello world'
  });
```