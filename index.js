const express = require("express")
const bodyParser = require("body-parser")
const ejs= require("ejs")
const md5 = require("md5")
const mongoose = require("mongoose")
const session = require("client-sessions")
const URI = "mongodb+srv://fmash1539:Byzf5S9OOW48qrNy@tutorcluster.anlqz.mongodb.net/tutoring?retryWrites=true&w=majority"

const app = express()

app.set("view engine", "ejs");

app.use(session({
    cookieName: 'session',
    secret: "hey",
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  }));

app.use(express.static("public"));

const connectDB = async()=>{
    await mongoose.connect(URI, {useUnifiedTopology: true, useNewUrlParser: true});
    console.log('db connected!');
};

connectDB();

app.use(bodyParser.urlencoded({extended : true}))

const studentSchema = new mongoose.Schema ({
    email: String,
    password: String,
    fName: String,
    lName: String,
    appts: Array
})

const tutorSchema = new mongoose.Schema ({
    email: String,
    password: String,
    fName: String,
    lName: String,
    days: Object,
    subject: String
})

const Student = new mongoose.model("Student", studentSchema)
const Tutor = new mongoose.model("Tutor", tutorSchema)

app.get("/", function(req, res){
    res.render("index")
})

app.get('/student', function(req, res) {
    Student.findOne({email: req.session.user.email}, function(err, foundStudent){
        if (err){
            console.log(err);
        }
        else{
            res.render("student", {studentObj: foundStudent})
        }
    })
})

app.get("/tutor",function(req,res){
    Tutor.findOne({email:req.session.user.email},function(err,foundTutor){
        if (err){
            console.log(err)
        }
        else{
            
            res.render("tutor",{tutorObj: foundTutor})
        }
    })
})

app.post("/loginS", function(req, res) {
    const pass = req.body.studentPass
    const email = req.body.studentEmail
    Student.findOne({email: email}, function(err, foundStudent) {
        if (err) {
            console.log(err)
        }
        else {
            if (foundStudent) {
                if (foundStudent.password == pass) {
                    req.session.user = foundStudent
                    res.redirect('/student')
                }
                else {
                    res.send("ERROR: Email or password id incorrect. Please try again")
                }     
            }
            else {
                res.send("Looks like a student with specified email doesn't exist. Please make an account")
            }  
            
        }
    })
})


app.post("/loginT", function(req, res){
    const email = req.body.tutorEmail
    const password = req.body.tutorPass

    Tutor.findOne({email: email}, function(err, foundTutor){
        if (err){
            console.log(err);
        }
        else{
            if (foundTutor){
                if (foundTutor.password == password){
                    req.session.user = foundTutor
                    res.redirect("/tutor")
                }
                else{
                    res.send("ERROR: Email or password id incorrect. Please try again")
                }
            }
            else{
                res.send("Looks like a Tutor with specified email does not exist")
            }
        }
    })
    
})

app.post("/registerS",function(req,res){
    const newEmail= req.body.studentEmail
    const firstName= req.body.studentFirst
    const lastName = req.body.studentLast
    const pass = req.body.studentPass
    Student.findOne({email: newEmail}, function(err, foundStudent) {
        if (err) {
            console.log(err);
        }
        else{
            if (foundStudent){
                res.send("Email already exists")
            }
            else {
                const currUser = new Student ({
                    email: newEmail,
                    password: pass,
                    fName: firstName,
                    lName: lastName,
                    appts: []
                })
                currUser.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        res.redirect("/")
                    }
                })   
            }
        }
    }) 
})

app.post("/registerT",function(req,res){
    const newEmail = req.body.tutorEmail
    const firstName = req.body.tutorFirst
    const lastName = req.body.tutorLast
    const pass = req.body.tutorPass
    Tutor.findOne({email: newEmail}, function(err, foundTutor){
        if (err){
            console.log(err);
        }
        else{
            if (foundTutor){
                res.send("Email already exists")
            }
            else{
                const currUser = new Tutor({
                    email: newEmail,
                    password: pass,
                    fName: firstName,
                    lName: lastName,
                    days: {
                        'Monday':{},
                        'Tuesday':{},
                        'Wednesday':{},
                        'Thursday':{},
                        'Friday':{},
                        'Saturday':{},
                        'Sunday':{}

                    },
                    subject: ""
                })

                currUser.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        res.redirect("/")
                    }
                }) 
                
            }
        }
    })
    
    
})

app.post('/schedule', function(req, res) {
    const date = req.body.apptDate
    const subject = req.body.subjects
    const time = req.body.time
    
    // Tutor.findOne({time: })
    res.redirect('/student')
    
})

app.post("/addAvail", function(req,res) {
    const day = req.body.days
    console.log(day);
    const startTime = req.body.startTime
    const endTime = req.body.endTime
    Tutor.findOne({email: req.session.user.email}, function(err, foundTutor){
        if (err){
            console.log(err);
        }
        else {
            console.log(foundTutor);
            foundTutor.days[day][startTime] = endTime
            console.log(foundTutor.days[day])
            foundTutor.save()
            // res.redirect("/tutor")
        }
    })
    
})

app.listen(3000,function(){
   console.log("Server port 3000 is running") 
//    Tutor.findOne({email: "tutorfm@gmail"}, function(err, foundTutor){
//     if (err){
//         console.log(err);
//     }
//     else {
//     console.log(foundTutor.days["Thursday"]);
//     }
// })
});