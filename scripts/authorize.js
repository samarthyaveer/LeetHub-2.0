const api = (() => {
  if (typeof chrome !== 'undefined' && chrome.runtime) return chrome;
  if (typeof browser !== 'undefined' && browser.runtime) return browser;
  throw new Error('BrowserNotSupported');
})();

const localAuth = {
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
   * Parses Access Code
   *
   * @param url The url containing the access code.
   */
  parseAccessCode(url) {
    if (url.match(/\?error=(.+)/)) {
      api.runtime.sendMessage({
        closeWebPage: true,
        isSuccess: false,
      });
    } else {
      const match = url.match(/[?&]code=([^&]+)/);
      if (!match) {
        api.runtime.sendMessage({
          closeWebPage: true,
          isSuccess: false,
        });
        return;
      }
      this.requestToken(decodeURIComponent(match[1]));
    }
  },

  /**
   * Request Token
   *
   * @param code The access code returned by provider.
   */
  requestToken(code) {
    const that = this;
    const data = new FormData();
    data.append('client_id', this.CLIENT_ID);
    data.append('client_secret', this.CLIENT_SECRET);
    data.append('code', code);
    data.append('redirect_uri', this.REDIRECT_URL);

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let token;
          try {
            token = JSON.parse(xhr.responseText).access_token;
          } catch (_err) {
            token = xhr.responseText.match(/access_token=([^&]*)/)?.[1];
          }

          if (!token) {
            api.runtime.sendMessage({
              closeWebPage: true,
              isSuccess: false,
            });
            return;
          }

          that.finish(token);
        } else {
          api.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: false,
          });
        }
      }
    });
    xhr.open('POST', this.ACCESS_TOKEN_URL, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send(data);
  },

  /**
   * Finish
   *
   * @param token The OAuth2 token given to the application from the provider.
   */
  finish(token) {
    /* Get username */
    // To validate user, load user object from GitHub.
    const AUTHENTICATION_URL = 'https://api.github.com/user';

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const username = JSON.parse(xhr.responseText).login;
          api.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: true,
            token,
            username,
            KEY: this.KEY,
          });
        }
      }
    });
    xhr.open('GET', AUTHENTICATION_URL, true);
    xhr.setRequestHeader('Authorization', `token ${token}`);
    xhr.send();
  },
};

localAuth.init(); // load params.
const link = window.location.href;

/* Check for open pipe */
if (window.location.host === 'github.com') {
  api.storage.local.get('pipe_leethub', data => {
    if (data && data.pipe_leethub) {
      localAuth.parseAccessCode(link);
    }
  });
}
