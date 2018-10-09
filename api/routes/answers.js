const express  = require('express');
const pg = require('pg');
const jwt = require('jsonwebtoken');

const myModules = require('./questions');
const dbURI = myModules.dbURI;
const router = express.Router();
const somethingWentWrong = myModules.somethingWentWrong;
const nothingHere = myModules.nothingHere;

router.use((req, res, next) => {
    myModules.authToken(req, res, next);
  });


//delete answer
router.delete('/:id', (req, res, err) => {
    const client = myModules.connectClient();
    client.query(`SELECT * FROM answers WHERE id=${req.params.id};`, (err, result) => {
        if(!err){
            if(result.rows.length > 0){
                client.query(`SELECT * FROM answers WHERE id=${req.params.id} AND answer_owner=${currentIdentity.id}`, (err, answer) => {
                    if(!err){
                        if(answer.rows.length > 0){
                            client.query(`DELETE FROM answers WHERE id=${req.params.id};`, (err, result) => {
                                if(!err){
                                  res.status(200).json({
                                      message: "Answer deleted successfully"
                                  });
                                }else{somethingWentWrong(err, res);}
                            });
                        }else{
                            res.status(400).json({
                                message: "Only answer owner can delete answer"
                            });
                        }
                    }else{somethingWentWrong(err, res);}
                });
            }else{nothingHere(res);}
        }else{somethingWentWrong(err, res);}
    });
});


//edit answer
router.put('/:id', (req, res, err) => {
    if(req.body.content){
        const client = myModules.connectClient();
        client.query(`SELECT * FROM answers WHERE id=${req.params.id};`, (err, result) => {
            if(!err){
                if(result.rows.length > 0){
                    client.query(`SELECT * FROM answers WHERE id=${req.params.id} AND answer_owner=${currentIdentity.id}`, (err, answer) => {
                        if(!err){
                            if(answer.rows.length > 0){
                                client.query(`UPDATE answers SET content='${req.body.content}' WHERE id=${req.params.id};`, (err, result) => {
                                    if(!err){
                                      res.status(200).json({
                                          message: "Answer updated successfully"
                                      });
                                    }else{somethingWentWrong(err, res);}
                                });
                            }else{
                                res.status(401).json({
                                    message: "Only answer owner can update an answer"
                                });
                            }
                        }else{somethingWentWrong(err, res);}
                    });
                }else{nothingHere(res);}
            }else{somethingWentWrong(err, res);}
        });
    }else{
        res.status(400).json({
            message: "Please provide content"
        });
    }
});


//accept answer
router.get('/accept/:id', (req, res, next) => {
    const client = myModules.connectClient();
    client.query(`SELECT * FROM answers WHERE id=${req.params.id};`, (err, result) => {
        if(!err){
          if(result.rows.length > 0){
              client.query(`SELECT * FROM questions WHERE id=${result.rows[0].question_id}`, (err, result) => {
                  if(!err){
                      if(result.rows[0].question_owner == currentIdentity.id){
                          client.query(`SELECT * FROM answers WHERE question_id=${result.rows[0].id} AND accepted=TRUE;`, (err, result) => {
                              if(!err){
                                  if(result.rows.length < 1){
                                      client.query(`UPDATE answers SET accepted=TRUE WHERE id=${req.params.id}`, (err, result) => {
                                          if(!err){
                                              res.status(200).json({
                                                  message: "Answer accepted successfully"
                                              });
                                          }else{somethingWentWrong(err, res);}
                                      });
                                  }else{
                                    res.status(200).json({
                                        message: "You can only accept one answer per question"
                                    });
                                  }
                              }else{somethingWentWrong(err, res);}
                          });
                      }else{
                          res.status(401).json({
                              message: "Only question owner can accept an answer"
                          });
                      }
                  }else{somethingWentWrong(err, res);}
              });
          }else{nothingHere(res);}
        }else{somethingWentWrong(err, res);}
    });
});


//upvote an answer
router.get('/upvote/:id', (req, res, next) => {
    const client = myModules.connectClient();
    client.query(`SELECT * FROM answers WHERE id=${req.params.id};`, (err, result) => {
        if(!err){
            if(result.rowCount > 0){
                if(result.rows[0].answer_owner != currentIdentity.id){
                    client.query(`SELECT * FROM votes WHERE id=${req.params.id} AND voter=${currentIdentity.id} AND upvote=TRUE;`, (err, result) => {
                        if(!err){
                            if(result.rowCount < 1){
                                client.query(`SELECT * FROM votes WHERE id=${req.params.id} AND voter=${currentIdentity.id} AND downvote=TRUE;`, (err, result) => {
                                    if(!err){
                                        if(result.rowCount < 1){
                                            client.query(`INSERT INTO votes(upvote, id, voter) VALUES(TRUE, ${req.params.id}, ${currentIdentity.id});`, (err, result) => {
                                                if(!err){
                                                    client.query(`UPDATE answers SET upvotes=upvotes + 1 WHERE id=${req.params.id}`, (err, result) => {
                                                        if(!err){
                                                          res.status(200).json({
                                                            message: "Answer upvoted successfully"
                                                          });
                                                      }else{somethingWentWrong(err, res);}
                                                    });
                                                }else{somethingWentWrong(err, res);}
                                            });
                                        }else{
                                            client.query(`UPDATE votes SET downvote=FALSE WHERE id=${req.params.id} AND voter=${currentIdentity.id};`, (err, result) => {
                                                if(!err){
                                                    client.query(`UPDATE votes SET upvote=TRUE WHERE id=${req.params.id} AND voter=${currentIdentity.id};`, (err, result) => {
                                                        if(!err){
                                                            client.query(`UPDATE answers SET upvotes=upvotes + 1 WHERE id=${req.params.id}`, (err, result) => {
                                                              if(!err){
                                                                res.status(200).json({
                                                                    message: "Answer Upvoted successfully"
                                                                });
                                                              }else{somethingWentWrong(err, res);}
                                                            });
                                                        }else{somethingWentWrong(err, res);}
                                                    });
                                                }else{somethingWentWrong(err, res);}
                                            });
                                          }
                                      }else{somethingWentWrong(err, res);}
                                  });
                              }else{
                                  client.query(`UPDATE votes SET upvote=FALSE WHERE id=${req.params.id} AND voter=${currentIdentity.id};`, (err, result) => {
                                      if(!err){
                                        client.query(`UPDATE answers SET upvotes=upvotes-1 WHERE id=${req.params.id}`, (err, result) => {
                                            if(!err){
                                              res.status(200).json({
                                                  message: "Upvote cancelled successfully"
                                              });
                                            }else{somethingWentWrong(err, res);}
                                        });
                                      }else{somethingWentWrong(err, res);}
                                  });
                              }
                          }else{somethingWentWrong(err, res);}
                      });
                }else{
                    res.status(400).json({
                        message: "You can't upvote your own answer"
                    });
                }
            }else{nothingHere(res);}
        }else{somethingWentWrong(err, res);}
    });
});


//downvote answer
router.get('/downvote/:id', (req, res, next) => {
    const client = myModules.connectClient();
    client.query(`SELECT * FROM answers WHERE id=${req.params.id};`, (err, result) => {
        if(!err){
            if(result.rowCount > 0){
                if(result.rows[0].answer_owner != currentIdentity.id){
                    client.query(`SELECT * FROM votes WHERE id=${req.params.id} AND voter=${currentIdentity.id} AND downvote=TRUE;`, (err, result) => {
                        if(!err){
                            if(result.rowCount < 1){
                                client.query(`SELECT * FROM votes WHERE id=${req.params.id} AND voter=${currentIdentity.id} AND downvote=TRUE;`, (err, result) => {
                                    if(!err){
                                        if(result.rowCount < 1){
                                            client.query(`INSERT INTO votes(downvote, id, voter) VALUES(TRUE, ${req.params.id}, ${currentIdentity.id});`, (err, result) => {
                                                if(!err){
                                                    client.query(`UPDATE answers SET downvotes=downvotes + 1 WHERE id=${req.params.id}`, (err, result) => {
                                                        if(!err){
                                                          res.status(200).json({
                                                            message: "Answer downvoted successfully"
                                                          });
                                                      }else{somethingWentWrong(err, res);}
                                                    });
                                                }else{somethingWentWrong(err, res);}
                                            });
                                        }else{
                                            client.query(`UPDATE votes SET downvote=FALSE WHERE id=${req.params.id} AND voter=${currentIdentity.id};`, (err, result) => {
                                                if(!err){
                                                    client.query(`UPDATE votes SET downvote=TRUE WHERE id=${req.params.id} AND voter=${currentIdentity.id};`, (err, result) => {
                                                        if(!err){
                                                            client.query(`UPDATE answers SET downvotes=downvotes + 1 WHERE id=${req.params.id}`, (err, result) => {
                                                              if(!err){
                                                                res.status(200).json({
                                                                    message: "Answer downvoted successfully"
                                                                });
                                                              }else{somethingWentWrong(err, res);}
                                                            });
                                                        }else{somethingWentWrong(err, res);}
                                                    });
                                                }else{somethingWentWrong(err, res);}
                                            });
                                          }
                                      }else{somethingWentWrong(err, res);}
                                  });
                              }else{
                                  client.query(`UPDATE votes SET downvote=FALSE WHERE id=${req.params.id} AND voter=${currentIdentity.id};`, (err, result) => {
                                      if(!err){
                                        client.query(`UPDATE answers SET downvotes=downvotes-1 WHERE id=${req.params.id}`, (err, result) => {
                                            if(!err){
                                              res.status(200).json({
                                                  message: "downvote cancelled successfully"
                                              });
                                            }else{somethingWentWrong(err, res);}
                                        });
                                      }else{somethingWentWrong(err, res);}
                                  });
                              }
                          }else{somethingWentWrong(err, res);}
                      });
                }else{
                    res.status(400).json({
                        message: "You can't downvote your own answer"
                    });
                }
            }else{nothingHere(res);}
        }else{somethingWentWrong(err, res);}
    });
});


module.exports = router;
