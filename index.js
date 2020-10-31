const express = require("express")
const bodyParser = require("body-parser")
const ejs= require("ejs")
const md5 = require("md5")
const mongoose = require("mongoose")
const session = require("client-sessions")
const URI = "mongodb+srv://fmash1539:Byzf5S9OOW48qrNy@tutorcluster.anlqz.mongodb.net/tutoring?retryWrites=true&w=majority"

const app = express()

app.set("view engine", "ejs");

app.use(express.static("public"));

const connectDB = async()=>{
    await mongoose.connect(URI, {useUnifiedTopology: true, useNewUrlParser: true});
    console.log('db connected!');
};

connectDB();

app.get("/", function(req, res){
    res.render("index")
})

app.use(bodyParser.urlencoded({extended : true}))

const userSchema = new mongoose.Schema ({
    
})

app.post("/",function(req,res){
    
});



app.listen(3000,function(){
   console.log("Server port 3000 is running") 
});