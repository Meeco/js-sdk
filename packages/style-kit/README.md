# Meeco Style Kit

Styled building blocks for Meeco web applications.

<img width="100px" src="https://uploads-ssl.webflow.com/5cd5168c6c861f4fc7cfe969/5ddcaba04d724676d8758927_Meeco-Logo-2019-Circle-RGB.svg">

## Installation

### In your node application/module

1. Run `npm install --save @meeco/stylekit`
2. Import the css file into the top of your main `scss` file with
   `@import '~@meeco/style-kit/build/main';`

## Usage

For detailed usage instructions and examples see the docs at [https://meeco.github.io/sdk-docs/style-kit/?path=/docs/](https://meeco.github.io/sdk-docs/style-kit/?path=/docs/).

### Assets

If you use the Meeco icon font, the files are located in the `assets` folder. You can copy them to your server or use a bundler to do it automatically. The following formats should be included:

```
node_modules/
  @meeco/
    style-kit/
      assets/
        meeco-icons.eot
        meeco-icons.svg
        meeco-icons.ttf
        meeco-icons.woff
```

### Development

Once you have checked out this repository change to the project repository and run `npm install`.

If you run `npm start` in this directory, it will start the [storybook](https://storybook.js.org/) project which should open itself in your default browser;

All view stories should be contained in the `stories/` folder.

All publicly available style kit should live in the `src/` folder.

Where possible, keep styles free from side-effects. That is, use mixins so only the styles that a developer wishes to use are included in their final are used and the rest can be shaken out.

_Good_

```scss
@mixin meeco-button {
  // these styles are only included if the dev wires `@include meeco-button`
  button {
    background-color: $meeco-red;
    border-radius: 16px;
  }
}
```

_Bad_

```scss
// these styles always included, even if the dev does not require them
button {
  background-color: $meeco-red;
  border-radius: 16px;
  &.hover {
    background-color: lighten($meeco-red, 20%);
  }
}
```

The exception being the `main` css file which is expected to be a complete css drop-in framework version of the style-kit (sort of lik Bootstrap) which could be imported into a page and used.

### Writing Stories

All stories should have a default export of at least their title:

```js
export default { title: 'My Widget' };
```

There are several ways to write stories. The name of the export is the subtitle of the story, and the return can be either a string or a function that returns a HTML element:

```js
export const basicButton = () => `<button>Basic</button>`;

export const complexButton = () => {
  const button = document.createElement('button');
  button.innerHTML = 'complex';
  button.className = 'complex-button';
  return button;
};
```

See the [storybook documentation](https://storybook.js.org/docs/basics/writing-stories/) for more information;

### Including styles

Styles that are loaded with the `style-loader` will automatically include the imported file in the `<styles>` tag at the top of the page. These should be kept only to storybook files to avoid side effects:

```js
import 'style-loader!./button.scss';
```

Styles imported using the `to-string-loader` (the default) return only the text of the scss/css file allowing them to be used in, for example, web components:

```js
import styles from './hello-world.scss';

/// ...

shadowRoot.innerHTML = `
  <style>
    ${styles.toString()}
  </style>
  <p>Hello World!</p>
`;
```
