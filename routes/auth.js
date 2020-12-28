const express = require('express');
const { helper, client } = require('../lib');

// eslint-disable-next-line
const router = express.Router();
router.get('/as1', (req, res) => {
  switch (req.query.type) {
  case 'pushed':
    helper.oAuth2Push(req, res);
    break;

  case 'logout':
    helper.oAuth2Logout(req, res);
    break;

  case 'basic':
  default:
    res.redirect(helper.oAuthBasic(req, res));
  }
});

router.get('/cb/as1', (req, res) => {
  const params = client.callbackParams(req);
  const codeVerifier = helper.getCodeVerifier(req, res);

  delete req.session.auth_response;
  delete req.session.auth_error;
  client.callback(
    'http://localhost:3000/auth/cb/as1',
    params,
    { code_verifier: codeVerifier },
  ).then((tokenSet) => {
    const idTokenSet = tokenSet.id_token.split('.');
    const idToken = {
      header: idTokenSet.shift(),
      payload: idTokenSet.shift(),
      hmac: idTokenSet.shift(),
    };

    req.session.auth_response = {
      code: params.code,
      openID: JSON.stringify(tokenSet.claims(), null, 2),
      tokenSet: JSON.stringify(tokenSet, null, 2),
      idToken: JSON.stringify(idToken, null, 2),
      token: tokenSet.access_token,
    };
  }).catch((err) => {
    req.session.auth_error = err.message;
  }).finally(() => {
    res.redirect('/auth/response');
  });
});

router.get('/cb/logout', (req, res) => {
  delete req.session.auth_response;
  res.render('logout', { session: JSON.stringify(req.session, null, 2) });
});

router.get('/response', (req, res) => {
  if (req.session.auth_response) {
    helper.clearCodeVerifier(req);
    res.render('response', req.session.auth_response);
  } else {
    res.render('status', {
      text: req.session.auth_error ? req.session.auth_error : 'Unknown Result Try Ask Token Again!',
    });
  }
});

router.get('/token', (req, res) => {
  client.userinfo(req.session.auth_response.token) // => Promise
    .then((data) => res.json(data))
    .catch((err) => {
      res.json({
        error: err.message,
      });
    });
});

router.get('/introspection', (req, res) => {
  client.introspect(req.session.auth_response.token) // => Promise
    .then((data) => res.json(data))
    .catch((err) => {
      res.json({
        error: err.message,
      });
    });
});

router.get('/revoke', (req, res) => {
  client.revoke(req.session.auth_response.token) // => Promise
    .then((data) => res.json({
      msg: '成功!',
    }))
    .catch((err) => {
      res.json({
        error: err.message,
      });
    });
});

router.get('/logout', (req, res) => {
  try {
    const idToken = JSON.parse(req.session.auth_response.idToken);
    res.redirect(client.endSessionUrl({
      id_token_hint: Object.entries(idToken).map((entry) => entry[1]).join('.'),
    }));
  } catch (err) {
    res.redirect('/');
  }
});

module.exports = router;
