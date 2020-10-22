const express = require('express')
const path = require('path')
const layout = require('./lib/layout')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000

app.use(layout)
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'jade')
app.set('views', path.join(__dirname, '/views'))
app.set('layout', '_layout')

const client = require('./lib/client');
const routeIndex = require('./routes');
const routeJose = require('./routes/jose');
const routeError = require('./routes/error');
routeIndex(client,app)
app.use('/jose', routeJose)
routeError(app)

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`)
})
