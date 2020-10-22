const express = require('express');
const router = express.Router();
const jose = require('jose');

const algorithmWithNum = ['oct', 'RSA']

function getKey(body, key) {
  const JWK = body[key]
  return JWK ? jose.JWK.asKey(JSON.parse(JWK)) : null;
}

router.get('/', (req, res) => {
  res.render('jose/index');
});

router.post('/generate', (req, res) => {
  const algorithm = (req.body.alg || 'EC');
  let method = req.body[algorithm] || 'P-256';
  method = algorithmWithNum.indexOf(algorithm) === -1 ? method : +method

  jose.JWK.generate(algorithm, method)
    .then(key => res.json({
      public: key.toJWK(),
      private: key.toJWK(true)
    }))
    .catch(err => res.json({ error: err.message }))
});

router.post('/build', (req, res) => {
  const type = req.body._type || 'jws';
  const key = getKey(req.body, 'private');
  if (key === null) {
    return res.json({ error: 'Please Generate Key First' })
  }

  try {
    let result;
    switch (type) {
      case 'jwe':
        result = jose.JWE.encrypt(req.body._message, key, {
          alg: req.body.jwe_alg,
          enc: req.body.jwe_enc
        })
        break;

      case 'jws':
      default:
        let payload = {};
        req.body._claim_key.forEach((el, i) => {
          payload[el] = req.body._claim_val[i]
        })
        result = jose.JWS.sign(payload, key, {
          alg: req.body.jws_alg
        })
    }
    res.json({ result, type })
  } catch (e) {
    res.json({ error: e.message })
  }
})

router.post('/destruct', (req, res) => {
  const type = req.body.type || 'jws';
  const key = getKey(req.body, 'private');
  if (key === null) {
    return res.json({ error: 'Please Generate Key First' })
  }

  const result = req.body.result || '';
  try {
    let origin;
    switch (type) {
      case 'jwe':
      origin = jose.JWE.decrypt(result, key, { complete: true })
      origin.cleartext = JSON.parse(origin.cleartext.toString())
      break;

      case 'jws':
      default:
      origin = jose.JWS.verify(result, key, { complete: true })
      origin.payload = JSON.parse(origin.payload.toString())
    }
    res.json({ origin })
  } catch (e) {
    res.json({ error: e.message })
  }
})

module.exports = router;
