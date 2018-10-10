const express = require('express');
const pg = require('pg')
const jwt = require('jsonwebtoken')


const router = express.Router();
const dbURI = process.env.dbURI;


//connect to db
const connectClient = () => {
    const newClient = new pg.Client(dbURI);
    newClient.connect();
    return newClient;
}


//something went wrong
const somethingWentWrong = (err, res) => {
  console.log(err);
  res.status(500).json({
      message: "something went wrong"
  });
}


//nothing here
const nothingHere = (res) => {
  res.status(404).json({
      message: "nothing here"
  });
}


//check authToken
const authToken = (req, res, next) => {
  const token = req.body.token || req.query.token || req.get('Authorization');
  if(token){
      jwt.verify(token, process.env.SecretKey, (err, decoded) => {
          if(err){
            if(String(err).match("TokenExpiredError")){
                res.status(403).json({
                  message: "Your session has timed out"
                });
            }else{
              console.log(err);
              res.status(500).json({
                message: "We are having trouble decoding you're token"
              });
            }
          }else{
            currentIdentity = decoded;
            req.decoded = decoded;
            next();
          }
      });
  }else{
    res.status(403).json({
        message: "We could not find your token"
    });
  }
}

//check authorization
router.use((req, res, next) => {
    authToken(req, res, next);
});


//get all questions
router.get('/', (req, res, next) => {
    const client = connectClient();
    client.query('SELECT * FROM questions;', (err, result) => {
      try{
          if(result.rows.length > 0)
              res.status(200).json(result.rows);
          else {
            res.status(404).json({
              message: "No questions posted yet"
            });
          }
        }catch(err){somethingWentWrong(err, res);}
        client.end();
    });
});


//post a question
router.post('/', (req, res, next) => {
  const client = connectClient();
    client.query(`INSERT INTO questions (content, question_owner, posted_on) VALUES('${req.body.content}', ${currentIdentity.id}, CURRENT_TIMESTAMP)`, (err, result, rows) => {
        if(!err){
            res.status(201).json({
              "message": "question posted successfully"
            });
        }else{somethingWentWrong(err, res);}
        client.end();
    });
});


//get specific question
router.get('/:id', (req, res) =>{
    const client = connectClient();
    client.query(`SELECT * FROM questions WHERE id=${req.params.id};`, (err, result) =>{
        if(!err){
            if(result.rows.length > 0){
                client.query(`SELECT * FROM answers WHERE question_id=${req.params.id};`, (err, answers) => {
                    result.rows.push({answers: answers.rows})
                    res.status(200).json(result.rows);
                });
            }else{nothingHere(res);}
        }else{somethingWentWrong(err, res);}
    });
});


//answer specific question
router.post('/:id/answers', (req, res) => {
    const client = connectClient();
    client.query(`SELECT * FROM questions WHERE id=${req.params.id};`, (err, result) => {
        if(!err){
            if(result.rows.length > 0){
                client.query(`INSERT INTO answers(content, answer_owner, question_id, posted_on) VALUES('${req.body.content}', ${currentIdentity.id}, ${req.params.id}, CURRENT_TIMESTAMP)`, (err) => {
                    if(!err){
                        res.status(201).json({
                            message: "question answered successfully"
                        });
                    }else{somethingWentWrong(err, res);}
                });
            }else{nothingHere(res)}
        }else{somethingWentWrong(err, res);}
    });
});


//delete a question
router.delete('/:id', (req, res) => {
      const client = connectClient();
      client.query(`SELECT * FROM questions WHERE id=${req.params.id};`, (err, result) => {
          if(!err){
            if(result.rows.length > 0){
                client.query(`SELECT * FROM questions WHERE id=${req.params.id} AND question_owner=${currentIdentity.id};`, (err, question) => {
                    if(question.rows.length > 0){
                        client.query(`DELETE FROM answers WHERE question_id=${req.params.id};`, (err, result) => {
                            if(!err){
                              client.query(`DELETE FROM questions WHERE id=${req.params.id};`, (err, result) => {
                                  if(!err){
                                    res.status(200).json({
                                      message: "question deleted successfully"
                                    });
                                  }
                              })
                            }else{somethingWentWrong(err, res);}
                        });
                    }else{
                        res.status(401).json({
                            message: "Only question owner can delete question"
                        });
                    }
                });
            }else{nothingHere(res);}
          }else{somethingWentWrong(err, res);}
      });
});


exports.router = router;
exports.authToken = authToken;
exports.connectClient = connectClient;
exports.dbURI = dbURI;
exports.somethingWentWrong = somethingWentWrong;
exports.nothingHere = nothingHere;
