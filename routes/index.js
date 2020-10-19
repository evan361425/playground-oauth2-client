const { Issuer } = require('openid-client');
const testIssuer = new Issuer({
  issuer: 'http://localhost:80',
  authorization_endpoint: 'http://localhost:80/auth',
  token_endpoint: 'http://localhost:80/auth',
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
      scope: 'openid',
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
        console.log('received and validated tokens %j', tokenSet);
        console.log('validated ID Token claims %j', tokenSet.claims());
      })
      .catch(err => {
        console.log(err.stack);
        console.log('something go wrong...')
      });
  })
}
