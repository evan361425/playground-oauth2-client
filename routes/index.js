const { Issuer } = require('openid-client');
const testIssuer = new Issuer({
  issuer: 'http://localhost:80',
  authorization_endpoint: 'http://localhost:80/auth',
  token_endpoint: 'http://localhost:80/token',
  jwks_uri: 'http://localhost:80/jwks',
  userinfo_endpoint: 'http://localhost:80/me',
  introspection_endpoint: 'http://localhost:80/token/introspection',
  revocation_endpoint: 'http://localhost:80/token/revocation'
})
const client = new testIssuer.Client({
  grant_types: ['authorization_code'],
  client_id: 'client-id-test',
  client_secret: 'client-secret-test-with-some-other-text',
  redirect_uris: ['http://localhost:3000/cb/as1'],
  response_types: ['code'],
});
const { generators } = require('openid-client');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index')
  })

  app.get('/as1', (req, res) => {
    const code_verifier = generators.codeVerifier();
    // store the code_verifier in your framework's session mechanism, if it is a cookie based solution
    // it should be httpOnly (not readable by javascript) and encrypted.
    res.cookie('oauth2.code_verifier.as1', code_verifier, {maxAge: 3600000, httpOnly: true})

    const code_challenge = generators.codeChallenge(code_verifier);

    const redirect = client.authorizationUrl({
      scope: 'openid profile',
      code_challenge,
      code_challenge_method: 'S256',
    });

    // res.render('status', {text: redirect})
    res.redirect(redirect);
  })

  app.get('/cb/as1', (req, res) => {
    const params = client.callbackParams(req);
    const code_verifier = req.cookies['oauth2.code_verifier.as1'];

    client.callback('http://localhost:3000/cb/as1', params, { code_verifier }) // => Promise
    .then((tokenSet) => {
      const id_token = tokenSet.id_token.split('.')
      const hmac =
      tokenSet.id_token_HEADER = id_token.shift()
      tokenSet.id_token_PAYLOAD = id_token.shift()
      tokenSet.id_token_HMAC = id_token.shift()
      res.render('response', {
        code: params.code,
        openID: JSON.stringify(tokenSet.claims(), null, 2),
        tokenSet: JSON.stringify(tokenSet, null, 2),
        token: tokenSet.access_token
      })
    })
    .catch(err => {
      res.render('status', {text: err.message})
    });
  })

  app.get('/token', (req, res) => {
    client.userinfo(req.query.token) // => Promise
    .then(data => res.json(data))
    .catch(err => {
      res.json({error: err.message})
      console.log(err)
    });
  })

  app.get('/introspection', (req, res) => {
    client.introspect(req.query.token) // => Promise
    .then(data => res.json(data))
    .catch(err => {
      res.json({error: err.message})
      console.log(err)
    });
  })

  app.get('/revoke', (req, res) => {
    client.revoke(req.query.token) // => Promise
    .then(data => res.json({msg: '成功!'}))
    .catch(err => {
      res.json({error: err.message})
      console.log(err)
    });
  })
}
