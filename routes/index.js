const { decrypt } = require('../lib/crypto');
const helper = require('../lib/helper');

module.exports = (client, app) => {
  app.get('/', (req, res) => {
    res.render('index')
  })

  app.get('/as1', (req, res) => {
    switch(req.query.type) {
      case 'pushed':
      helper.oAuth2Push(res, client)
      break;

      case 'logout':
      helper.oAuth2Logout(res, client)
      break;

      case 'basic':
      default:
      res.redirect(helper.oAuthBasic(res, client))
    }
  })

  app.get('/cb/as1', (req, res) => {
    const params = client.callbackParams(req);
    const code_verifier = helper.getCodeVerifier(req, res);

    client.callback('http://localhost:3000/cb/as1', params, { code_verifier }) // => Promise
    .then((tokenSet) => {
      const idTokenSet = tokenSet.id_token.split('.')
      const idToken = {
        header: idTokenSet.shift(),
        payload: idTokenSet.shift(),
        hmac: idTokenSet.shift()
      }
      res.render('response', {
        code: params.code,
        openID: JSON.stringify(tokenSet.claims(), null, 2),
        tokenSet: JSON.stringify(tokenSet, null, 2),
        idToken: JSON.stringify(idToken, null, 2),
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
    });
  })

  app.get('/introspection', (req, res) => {
    client.introspect(req.query.token) // => Promise
    .then(data => res.json(data))
    .catch(err => {
      res.json({error: err.message})
    });
  })

  app.get('/revoke', (req, res) => {
    client.revoke(req.query.token) // => Promise
    .then(data => res.json({msg: '成功!'}))
    .catch(err => {
      res.json({error: err.message})
    });
  })
}
