const { generators } = require('openid-client');
const { encrypt, decrypt } = require('../lib/crypto');
const url = require('url');
const http = require('http');
var querystring = require('querystring');

const COOKIE_CONTENT = 'oauth2.code_verifier.as1.content'
const COOKIE_IV = 'oauth2.code_verifier.as1.iv'

const formUrlEncode = (value) => encodeURIComponent(value).replace(/%20/g, '+');

function getCodeVerifier(req, res) {
  const hash = decrypt({
    content: req.cookies[COOKIE_CONTENT],
    iv: req.cookies[COOKIE_IV],
  });

  res.clearCookie(COOKIE_IV)
  res.clearCookie(COOKIE_CONTENT)
  return hash;
}

function oAuthBasic(res, client) {
  const code_verifier = generators.codeVerifier()
  const code_encrypted = encrypt(code_verifier)
  const config = { maxAge: 600000, httpOnly: true }

  res.cookie(COOKIE_CONTENT, code_encrypted.content, config)
  res.cookie(COOKIE_IV, code_encrypted.iv, config)

  const code_challenge = generators.codeChallenge(code_verifier);

  return client.authorizationUrl({
    scope: 'openid profile',
    code_challenge,
    code_challenge_method: 'S256',
  });
}

function oAuth2Push(res, client) {
  const post_data = oAuthBasic(res, client).split('?', 2)[1];
  const encoded = `${formUrlEncode(client.client_id)}:${formUrlEncode(client.client_secret)}`;
  const auth = Buffer.from(encoded).toString('base64');

  const target = url.parse(client.issuer.pushed_endpoint);
  const post_opts = {
    host: target.host.split(':')[0],
    port: target.host.split(':')[1] || 80,
    path: target.path,
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(post_data),
    }
  }

  const post_req = http.request(post_opts, setting => {
    setting.setEncoding('utf8');
    setting.on('data', data => {
      data = JSON.parse(data)
      const query = querystring.stringify({
        client_id: client.client_id,
        request_uri: data.request_uri
      });
      res.json({
        html: `<div><a href="${client.issuer.authorization_endpoint}?${query}">
          ${client.issuer.authorization_endpoint}?${query}
        </a></div>`,
      })
    })
  });
  post_req.write(post_data);
  post_req.end()
}

function oAuth2Logout(res) {
  res.redirect('/')
}

module.exports = {
  getCodeVerifier,
  oAuthBasic,
  oAuth2Push,
  oAuth2Logout
}
