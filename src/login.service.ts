import { Injectable } from '@angular/core';
import { remote } from 'electron';
import { AAD_CONFIG } from './app.aad-config';

@Injectable()
export class LoginService {
  

  public logIn(state = '/') {
    let authUrl =
      'https://login.microsoftonline.com/' +
      AAD_CONFIG.tenant +
      '/oauth2/authorize?response_type=id_token&client_id=' +
      AAD_CONFIG.clientId +
      '&redirect_uri=' +
      encodeURIComponent(AAD_CONFIG.redirectUri) +
      '&state=' +
      state +
      '&nonce=SomeNonce';

    let BrowserWindow = remote.BrowserWindow;

    let authWindow = new BrowserWindow({
      autoHideMenuBar: true,
      frame: true,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false
      },
      width: 800
    });

    authWindow.webContents.on('did-get-redirect-request', (event: any, oldUrl: string, newUrl: string) => {
      if (authWindow !== null) {
        authWindow.destroy();
      }

      let params: any = this.parseQueryString(newUrl);
      let idToken = params.id_token;
      if (idToken != null) {
        window.localStorage.setItem('id_token', idToken);
        window.localStorage.removeItem('access_token');

        this.getNewAccessToken();
      } else {
        window.localStorage.removeItem('id_token');
        window.localStorage.removeItem('access_token');
      }
    });

    authWindow.on('closed', () => {
      authWindow = null;
    });

    authWindow.loadURL(authUrl);
    authWindow.show();
  }

  public getNewAccessToken(state = '/') {
    let accessTokenUrl =
      'https://login.microsoftonline.com/' +
      AAD_CONFIG.tenant +
      '/oauth2/authorize?response_type=token&client_id=' +
      AAD_CONFIG.clientId +
      '&resource=' +
      AAD_CONFIG.graphApiUri +
      '&redirect_uri=' +
      encodeURIComponent(AAD_CONFIG.redirectUri) +
      '&prompt=none&state=' +
      state +
      '&nonce=SomeNonce';

    let BrowserWindow = remote.BrowserWindow;

    let accessWindow = new BrowserWindow({
      autoHideMenuBar: true,
      frame: false,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false
      },
      width: 800
    });

    accessWindow.on('closed', () => {
      if (accessWindow !== null) {
        accessWindow = null;
      }
    });

    accessWindow.webContents.on('did-get-redirect-request', (event: any, oldUrl: string, newUrl: string) => {
      if (accessWindow !== null) {
        accessWindow.destroy();
      }

      let params: any = this.parseQueryString(newUrl);
      let accessToken = params.access_token;
      if (accessToken != null) {
        window.localStorage.setItem('access_token', accessToken);

        // remote.getCurrentWindow().loadURL(originalURL + "index.html");
        // this.router.navigate(['home']);
      } else {
        window.localStorage.removeItem('access_token');
      }
    });

    accessWindow.loadURL(accessTokenUrl);
  }

  public logOut(state = '/') {
    window.localStorage.removeItem('id_token');
    window.localStorage.removeItem('access_token');
    // this.router.navigate(['login']);
  }

  public refreshAccessToken(state = '/') {
    this.logIn(state); // force login, assume that renewToken.html didn't work which is why dev is calling this.
  }

  public getAccessToken() {
    return window.localStorage.getItem('access_token');
  }

  private parseQueryString(url: string) {
    let params = {};
    let queryString = '';

    if (url.search('#') !== -1) {
      queryString = url.substring(url.search('#') + 1);
    } else {
      queryString = url.substring(url.indexOf('?') + 1);
    }

    let a = queryString.split('&');
    for (let i = 0; i < a.length; i++) {
      let b = a[i].split('=');
      params[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }

    return params;
  }
}
