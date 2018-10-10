const express = require('express');
const pg = require('pg');
const securePassword = require('secure-password');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const pwd  = securePassword();
const router = express.Router();
const dbURI = 'postgres://martinmuguna:@localhost:5432//usr/local/var/postgres/node-stackoverflowlite'


router.post('/signup', (req, res, next) => {
    const client = new pg.Client(dbURI);
    client.connect();


    const securePwd = async (password) => {
        try{
          let salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(password, salt);
          return hash.trim()
        }catch(err){
            console.log(err);
            return null;
        }
    }


    const createUser = async () => {
        password = await securePwd(req.body.password)
        client.query(`INSERT INTO users (username, email, password, created_on) VALUES ('${req.body.username}', '${req.body.email}', '${password}',  CURRENT_TIMESTAMP);`, (err, result) => {
            if(!err){
                res.status(201).json({
                    message: `User ${req.body.username} created successfully`
                });
            }else{
              console.log(err);
              res.status(500).json({
                  message: "something went wrong"
              });
            }
        });
    }


    client.query(`SELECT * FROM users WHERE email = '${req.body.email}';`, (err, result) => {
        if(!err){
          if(result.rows.length < 1){
            createUser();
          }else {
            res.status(400).json({
                message: "Email address has an account"
            })
          }
        }else{
          console.log(err);
          res.status(500).json({
              message: "something went wrong"
          });
        }
    });
});


router.post('/login', (req, res, next) => {
  const client = new pg.Client(dbURI);
  client.connect();


  const comparePswd = (hash, res) => {
      try{
        return bcrypt.compareSync(req.body.password, hash);
      }catch(err){
        console.log(err);
        return false;
      }
  }


  client.query(`SELECT * FROM users WHERE email = '${req.body.email}';`, (err, result) => {
      if(!err){
        try{
          if(comparePswd(result.rows[0].password.trim())){
              const payload = {
                  username: result.rows[0].username,
                  id: result.rows[0].id
              };
              let token = jwt.sign(payload, process.env.SecretKey, {
                expiresIn: 60*30
              });
              res.status(200).json({
                  message: "logged in successfully",
                  token:  token
              });
          }else{
              res.status(401).json({
                message: "Invalid credentials"
              });
          }
        }catch(err){
          console.log(err);
          res.status(401).json({
              message : "Something went wrong"
          });
        }
      }else{
        console.log(err);
        res.status(500).json({
            message: "something went wrong"
        });
      }
  });
});


module.exports = router;
