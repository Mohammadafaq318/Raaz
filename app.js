require('dotenv').config()
const express= require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();
const saltRounds=10;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
  }));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB', {useNewUrlParser:true});

const UserSchema= new mongoose.Schema({
    email: String,
    password: String
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/secrets", function(req,res){
    if ( req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
})

app.post("/register", function (req,res){

    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log("error registering user")
         }
         else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
         }
      });
});

app.post("/login",async function (req,res){

    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });
    
    req.login(user, function(err){
        if(err){
            console.log("user does not exists");
        }
        else{
            console.log("user logged in");
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
});

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})

const PORT=3000;
app.listen(PORT, function() {
    console.log("server started on port:"+ PORT);
});