const { Issuer } = require('openid-client');
const testIssuer = new Issuer({
  issuer: 'http://localhost:80',
  authorization_endpoint: 'http://localhost:80/auth',
  token_endpoint: 'http://localhost:80/token',
  pushed_endpoint: 'http://localhost:80/request',
  jwks_uri: 'http://localhost:80/jwks',
  userinfo_endpoint: 'http://localhost:80/me',
  introspection_endpoint: 'http://localhost:80/token/introspection',
  revocation_endpoint: 'http://localhost:80/token/revocation',
});
module.exports = new testIssuer.Client({
  grant_types: ['authorization_code'],
  client_id: 'client-id-test',
  client_secret: 'client-secret-test-with-some-other-text',
  redirect_uris: ['http://localhost:3000/auth/cb/as1'],
  response_types: ['code'],
});
