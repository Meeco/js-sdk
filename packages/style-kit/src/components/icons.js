class MeecoIcons extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  icons = {
    share: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 12V12C4 15.7712 4 17.6569 5.17157 18.8284C6.34315 20 8.22876 20 12 20V20C15.7712 20 17.6569 20 18.8284 18.8284C20 17.6569 20 15.7712 20 12V12"
      stroke="#e61e3d"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8 7L12 3M12 3L16 7M12 3V15"
      stroke="#e61e3d"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`
  };

  connectedCallback() {
    const { shadowRoot } = this;
    shadowRoot.innerHTML = this.icons.share;
  }
}

if (customElements && !customElements.get('meeco-icon')) {
  customElements.define('meeco-icon', MeecoIcons);
}
