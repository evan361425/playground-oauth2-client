const { generators } = require('openid-client');
const { encrypt, decrypt } = require('../lib/crypto');
const url = require('url');
const http = require('http');
const querystring = require('querystring');

const COOKIE_CONTENT = 'oauth2.code_verifier.as1.content';
const COOKIE_IV = 'oauth2.code_verifier.as1.iv';

const formUrlEncode = (value) => encodeURIComponent(value).replace(/%20/g, '+');

/**
 * get code verifier
 * @param  {express.Request} req
 * @param  {express.Response} res
 * @return {string}
 */
function getCodeVerifier(req, res) {
  const hash = decrypt({
    content: req.cookies[`${COOKIE_CONTENT}`],
    iv: req.cookies[`${COOKIE_IV}`],
  });

  res.clearCookie(COOKIE_IV);
  res.clearCookie(COOKIE_CONTENT);
  return hash;
}

/**
 * basic helper
 * @param  {express.Response} res
 * @param  {oidc.Client} client
 * @return {string}
 */
function oAuthBasic(res, client) {
  const codeVerifier = generators.codeVerifier();
  const codeEncrypted = encrypt(codeVerifier);
  const config = { maxAge: 600000, httpOnly: true };

  res.cookie(COOKIE_CONTENT, codeEncrypted.content, config);
  res.cookie(COOKIE_IV, codeEncrypted.iv, config);

  const codeChallenge = generators.codeChallenge(codeVerifier);

  return client.authorizationUrl({
    scope: 'openid profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
}

/**
 * pushed authorization
 * @param  {express.Response} res
 * @param  {oidc.Client} client
 * @return {void}
 */
function oAuth2Push(res, client) {
  const postData = oAuthBasic(res, client).split('?', 2)[1];
  const encoded = `${formUrlEncode(client.client_id)}:${formUrlEncode(client.client_secret)}`;
  const auth = Buffer.from(encoded).toString('base64');

  const target = url.parse(client.issuer.pushed_endpoint);
  const postOpts = {
    host: target.host.split(':')[0],
    port: target.host.split(':')[1] || 80,
    path: target.path,
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const postReq = http.request(postOpts, (setting) => {
    setting.setEncoding('utf8');
    setting.on('data', (data) => {
      data = JSON.parse(data);
      const query = querystring.stringify({
        client_id: client.client_id,
        request_uri: data.request_uri,
      });
      res.json({
        html: `<div><a href="${client.issuer.authorization_endpoint}?${query}">
          ${client.issuer.authorization_endpoint}?${query}
        </a></div>`,
      });
    });
  });
  postReq.write(postData);
  postReq.end();
}

/**
 * logout
 * @param  {express.Response} res
 * @return {void}
 */
function oAuth2Logout(res) {
  res.redirect('/');
}

module.exports = {
  getCodeVerifier,
  oAuthBasic,
  oAuth2Push,
  oAuth2Logout,
};
