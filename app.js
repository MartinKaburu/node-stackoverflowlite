const express  = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser')
const myQuestions = require('./api/routes/questions');
const myAnswers = require('./api/routes/answers');
const myUsers = require('./api/routes/users');

const app = express();

app.use(morgan('default'));
app.use(bodyParser.json())

app.use('/questions', myQuestions.router);
app.use('/answers', myAnswers);
app.use('/users', myUsers);


module.exports = app;
