require('dotenv').config()
const express= require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate =  require('mongoose-findorcreate')
const app = express();

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
    password: String,
    googleId: String,
    secret: String
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

const User = mongoose.model('User', UserSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
passport.deserializeUser(function(user, done) {
done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ email: profile.emails[0].value, googleId: profile.id }, function (err, user) { 
     return cb(err, user) 
    });
}
));


app.get("/",function(req,res){
    res.render("home");
})

app.get("/auth/google", passport.authenticate('google', { scope: ['profile',"email"] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/secrets", async function(req, res){
    try{
        const foundUsers = await User.find({ "secret": { $ne: null } }).exec();
        if (foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers});
          }
    }catch(error){
        console.log(error);
    }
  });
  
app.get("/submit", function(req, res){
if (req.isAuthenticated()){
    res.render("submit");
} else {
    res.redirect("/login");
}
});

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

app.post("/submit", async function (req, res) {
    const submittedSecret = req.body.secret;

    try {
        console.log(req.user);
        const foundUser = await User.findById(req.user._id);
        
        if (!foundUser) {
            console.log("User not found");
            return; // or handle the error appropriately
        }
    
        foundUser.secret = submittedSecret;
        await foundUser.save();
    
        res.redirect("/secrets");
    } catch (err) {
        console.error(err);
        // Handle the error in an appropriate way, such as sending an error response to the client.
    }
  });
  

const PORT=3000;
app.listen(PORT, function() {
    console.log("server started on port:"+ PORT);
});