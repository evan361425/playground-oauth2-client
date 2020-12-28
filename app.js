const express = require('express');
const path = require('path');
const { layout } = require('./lib');
const session = require('express-session');
const bodyParser = require('body-parser');
const routes = require('./routes');

const PORT = 3000;
(async (app) => {
  app.use(layout);
  app.use(session({
    secret: 'some-random-secret-key',
    cookie: { maxAge: 3600000 },
    resave: true,
    saveUninitialized: true,
  }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, '/views'));
  app.set('layout', '_layout');

  app.use('/auth', routes.auth);
  app.use('/jose', routes.jose);
  app.get('/', (req, res) => res.render('index'));

  app.use(routes.error);

  app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
  });
})(express());
