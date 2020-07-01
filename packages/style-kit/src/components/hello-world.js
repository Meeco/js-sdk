import styles from './hello-world.scss';

class HelloWorld extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const { shadowRoot } = this;
    shadowRoot.innerHTML = `
    <style>
      ${styles.toString()}
    </style>
    <p>Hello World!</p>
    `;
  }
}

if (customElements && !customElements.get('hello-world')) {
  // define if not already defined;
  customElements.define('hello-world', HelloWorld);
}
