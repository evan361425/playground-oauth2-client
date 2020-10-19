const express = require('express')
const path = require('path')
const layout = require('./lib/layout')
const cookieParser = require('cookie-parser');
const app = express()
const port = 3000

app.use(layout)
app.use(cookieParser());

app.set('view engine', 'jade')
app.set('views', path.join(__dirname, '/views'))
app.set('layout', '_layout')

require('./routes')(app)
require('./routes/error')(app)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
