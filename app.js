require('dotenv').config()
const express= require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var md5 = require('md5');
const bcrypt = require('bcrypt');

const app = express();
const saltRounds=10;


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB', {useNewUrlParser:true});

const UserSchema= new mongoose.Schema({
    email: String,
    password: String
});


const User = mongoose.model('User', UserSchema);


app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.post("/register", function (req,res){

    bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
        const newUser= new User ({
            email: req.body.username,
            password: hash
        });

        try {
            await newUser.save();
            console.log("New User added");
            res.render("secrets") 
            } 
        catch (err) {
            console.log(err);
            }
    });
    
    
    
});

app.post("/login",async function (req,res){


    
    const username=req.body.username;
    const password=req.body.password;

   
    try {
        const FoundUser= await User.findOne({email: username});

        if(FoundUser){
            bcrypt.compare(password, FoundUser.password, function(err, result) {

                if(result === true){
                    res.render("secrets");
                }
                else{
                    res.render("login");
                }
                
            });
        }
        else{
            res.render("login");
        }
        } 
    catch (err) {
        console.log(err);
        }
    
});

const PORT=3000;
app.listen(PORT, function() {
    console.log("server started on port:"+ PORT);
});