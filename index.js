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
    monday: Array,
    tuesday: Array,
    wednesday: Array,
    thursday: Array,
    friday: Array,
    saturday: Array,
    sunday: Array,
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
            
            res.render("tutor", {tutorObj: foundTutor})
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
                    monday: [],
                    tuesday: [],
                    wednesday: [],
                    thursday: [],
                    friday: [],
                    saturday: [],
                    sunday: [],
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

app.get("/delete", function(req, res){
    const day = req.query.DAY
    const index = req.query.INDEX
    console.log(day);
    console.log(index);
    // Implement Delete
    res.redirect("/tutor")
})

app.post('/schedule', function(req, res) {
    const date = req.body.apptDate
    const subject = req.body.subjects
    const time = req.body.time
    const newDate=date.slice(0,4)+"/"+date.slice(5,7)+"/"+date.slice(8,10)
    console.log(newDate)
    const dayofWeek= new Date(newDate).getDay()
    Tutor.find({},function(err,tutors){
        if (err){
            console.log(err);
        }
        else{
            var found = false
            
            
            for(i=0; i < tutors.length; i++){
                if(dayofWeek==0){
                    const hour= parseInt(time.slice(0,3))
                    const min = parseInt(time.slice(4,6))
                    for(j=0;j<tutors[i].sunday.length;j++ ){
                        const tutorHour=parseInt(tutors[i].sunday[j].slice(0,3))-1
                        const tutorMin = parseInt(tutors[i].sunday[j].slice(4,6))
                        if(tutorHour>hour && (j+1)%2==0 && min<=tutorMin){
                            found = true
                            const tutorFname=tutors[i].fName
                            const tutorLname=tutors[i].lName
                            const tutoremail=tutors[i].email
                        }
                    }
    
    
                }
                if(dayofWeek==1){
                    newDay="Monday"
    
    
                }
                if(dayofWeek==2){
                    newDay="Tuesday"
    
    
                }
                if(dayofWeek==3){
                    newDay="Wednesday"
    
    
                }
                if(dayofWeek==4){
                    newDay="Thursday"
    
    
                }
                if(dayofWeek==5){
                    newDay="Friday"
    
    
                }
                if(dayofWeek==6){
                    newDay="Saturday"
    
    
                }
            

            }
        }


    })
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
            if (day=="Monday"){
                foundTutor.monday.push(startTime)
                foundTutor.monday.push(endTime)
            }
            else if (day=="Tuesday"){
                foundTutor.tuesday.push(startTime)
                foundTutor.tuesday.push(endTime)   
            }
            else if (day=="Wednesday"){
                foundTutor.wednesday.push(startTime)
                foundTutor.wednesday.push(endTime)
            }
            else if (day=="Thursday"){
                foundTutor.thursday.push(startTime)
                foundTutor.thursday.push(endTime)
            }
            else if (day=="Friday"){
                foundTutor.friday.push(startTime)
                foundTutor.friday.push(endTime)
                
            }
            else if (day=="Saturday"){
                foundTutor.saturday.push(startTime)
                foundTutor.saturday.push(endTime)
            }
            else if (day=="Sunday"){
                foundTutor.sunday.push(startTime)
                foundTutor.sunday.push(endTime)
            }
            foundTutor.save()
            res.redirect("/tutor")
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