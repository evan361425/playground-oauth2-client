const express = require('express')
const path = require('path')
const layout = require('./lib/layout')
const cookieParser = require('cookie-parser');
const app = express()
const PORT = 3000

app.use(layout)
app.use(cookieParser());

app.set('view engine', 'jade')
app.set('views', path.join(__dirname, '/views'))
app.set('layout', '_layout')

const client = require('./lib/client');
require('./routes')(client,app)
require('./routes/error')(app)

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`)
})
