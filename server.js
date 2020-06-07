const express = require('express')
const recipesRouter = require('./routes/recipes-router');
const sendErrorResponse = require('./routes/utils.js').sendErrorResponse;
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const db_name = 'recipes-blog';

const app = express();
const port = 8080;

app.use(express.json({limit: '50mb'}));

app
    .use('/api/users', recipesRouter)

app.use(function (err, req, res, next) {
    console.error(err.stack)
    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
})

MongoClient.connect(url, { useUnifiedTopology: true }, function (err, con) {
    if (err) throw err;
    app.locals.db = con.db(db_name);
    console.log(`Connection established to ${db_name}.`);
    app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
});