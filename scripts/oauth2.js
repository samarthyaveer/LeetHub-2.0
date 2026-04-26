const getExtensionApi = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) return chrome;
  if (typeof browser !== 'undefined' && browser.runtime) return browser;
  throw new Error('BrowserNotSupported');
};

// eslint-disable-next-line no-unused-vars
const oAuth2 = {
  /**
   * Initialize
   */
  init() {
    this.KEY = 'leethub_token';
    this.ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
    this.AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';
    this.CLIENT_ID = '0114dd35b156d4729fac';
    this.CLIENT_SECRET = 'cfc3301d9745530bf1b31e92528ad9c31fd3f995';
    this.REDIRECT_URL = 'https://github.com/'; // for example, https://github.com
    this.SCOPES = ['repo'];
  },

  /**
   * Begin
   */
  begin() {
    this.init(); // secure token params.

    const api = getExtensionApi();
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URL,
      scope: this.SCOPES.join(' '),
    });
    const url = `${this.AUTHORIZATION_URL}?${params.toString()}`;

    api.storage.local.set({ pipe_leethub: true }, () => {
      // opening pipe temporarily, redirects to github
      api.tabs.create({ url, active: true }, function () {});
    });
  },
};
