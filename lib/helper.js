const { generators } = require('openid-client');
const url = require('url');
const http = require('http');
const querystring = require('querystring');
const client = require('./client');

/**
 * basic helper
 * @param  {express.Request} req
 * @param  {express.Response} res
 * @return {string}
 */
function oAuthBasic(req, res) {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const provider = getAuthorizationServerName(req.url);

  req.session[`oauth2.code_verifier.${provider}`] = codeVerifier;
  console.log(`set up code_verifier: ${codeVerifier} in session: ${provider}`);

  return client.authorizationUrl({
    scope: 'openid profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
}

/**
 * pushed authorization
 * @param  {express.Request} req
 * @param  {express.Response} res
 * @return {void}
 */
function oAuth2Push(req, res) {
  const postData = oAuthBasic(req, res, client).split('?', 2)[1];
  console.log(`Ask pushed request with param: ${postData}`);
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

      if (data.error_description) {
        res.json({ html: `<div>${data.error_description}</div>` });
      } else {
        const query = querystring.stringify({
          client_id: client.client_id,
          request_uri: data.request_uri,
        });
        const link = `${client.issuer.authorization_endpoint}?${query}`;

        res.json({
          html: `<div><a href="${link}">${link}</a></div>`,
        });
      }
    });
  });
  postReq.write(postData);
  postReq.end();
}

/**
 * logout
 * @param  {express.Request} req
 * @param  {express.Response} res
 * @return {void}
 */
function oAuth2Logout(req, res) {
  res.redirect('/');
}

function formUrlEncode(value) {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

function getAuthorizationServerName(rawUrl) {
  return url.parse(rawUrl).pathname.split('/').slice(-1)[0];
}

/**
 * get code verifier
 * @param  {express.Request} req
 * @param  {express.Response} res
 * @return {string}
 */
function getCodeVerifier(req) {
  const provider = getAuthorizationServerName(req.url);
  const codeVerifier = req.session[`oauth2.code_verifier.${provider}`];
  console.log(`get code_verifier: ${codeVerifier} in session: ${provider}`);

  return codeVerifier;
}

function clearCodeVerifier(req) {
  delete req.session['oauth2.code_verifier.as1'];
}

module.exports = {
  getCodeVerifier,
  oAuthBasic,
  oAuth2Push,
  oAuth2Logout,
  clearCodeVerifier,
};
