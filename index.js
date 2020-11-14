const express = require("express")
const bodyParser = require("body-parser")
const ejs= require("ejs")
const md5 = require("md5")
const mongoose = require("mongoose")
const session = require("client-sessions")
const URI = "mongodb+srv://fmash1539:Byzf5S9OOW48qrNy@tutorcluster.anlqz.mongodb.net/tutoring?retryWrites=true&w=majority"
const flash = require('connect-flash')
var nodemailer = require('nodemailer');

const app = express()

const server = require('http').Server(app)
const socketio = require('socket.io')
const e = require("express")
const io = socketio(server)

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'tutorfirstinc@gmail.com',
      pass: 'Fmmuio2023'
    }
  });

app.set("view engine", "ejs");

app.use(session({
    cookieName: 'session',
    secret: "hey",
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  }));

app.use(express.static("public"));

app.use(flash())

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
    zoom: String,
    monday: Array,
    tuesday: Array,
    wednesday: Array,
    thursday: Array,
    friday: Array,
    saturday: Array,
    sunday: Array,
    subject: String,
    students: Array,
    apptDates: Array,
    apptTimes: Array
})

const Student = new mongoose.model("Student", studentSchema)
const Tutor = new mongoose.model("Tutor", tutorSchema)

function convert_military_to_twelve(time) {
    var am = "AM"
    var pm = "PM"
    var timeString = ""
    if (parseInt(time.slice(0,2)) <= 12) {
        timeString = time + am
    }
    else {
        timeString = parseInt(time.slice(0,2))%12 + ":" + parseInt(time.slice(3,5)) + pm
    }
    return timeString
}


app.get("/", function(req, res){
    res.render("index", {message: req.flash('message')})
})

app.get('/student', function(req, res) {
    Student.findOne({email: req.session.user.email}, function(err, foundStudent){
        if (err){
            console.log(err);
        }
        else{
            res.render("student", {studentObj: foundStudent,  
                message: req.flash('message')})
        }
    })
})

app.get('/room', function(req, res){
    res.render('room', {roomId: req.query.room_id, email: req.session.user.email})
    
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId)
  
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId)
      })
    })
  })


app.get("/tutor",function(req,res){
    Tutor.findOne({email:req.session.user.email},function(err,foundTutor){
        if (err){
            console.log(err)
        }
        else{
            console.log("FoundTutor Obj after redirect: ");
            console.log(foundTutor);
            res.render("tutor", {tutorObj: foundTutor, message: req.flash('message')})
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
                        req.flash('message', 
                        "ERROR: Email or password id incorrect. Please try again")
                    }     
                }
                else {
                    req.flash('message', 
                    "Looks like a student with specified email doesn't exist. Please make an account")
                }  
            }
        })
})


app.post("/loginT", function(req, res){
    if (req.session.user) {
        res.redirect('/tutor')
    }
    else {
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
                        req.flash('message', "ERROR: Email or password id incorrect. Please try again")
                    }
                }
                else{
                    req.flash('message', "Looks like a Tutor with specified email does not exist")
                }
            }
        })    
    }
})

app.post("/registerS",function(req,res){
        const newEmail= req.body.studentEmail
        const firstName= req.body.studentFirst
        const lastName = req.body.studentLast
        const pass = req.body.studentPass
        const fam = req.body.fam
        const income = req.body.income
        const famToIncome = {
            2: 17240,
            3: 21720,
            4: 26200,
            5: 30680
        }
        if (famToIncome[fam] < parseInt(income)){
            res.send("Family income too high.")
        }
        else{
            Student.findOne({email: newEmail}, function(err, foundStudent) {
                if (err) {
                    console.log(err);
                }
                else{
                    if (foundStudent){
                        req.flash('message', "Email already exists")
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
                                req.flash('message', "Account successfully created. Please login")
                                res.redirect("/")
                            }
                        })   
                    }
                }
            })
    }
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
                    req.flash('message', "Email already exists")
                }
                else{
                    const currUser = new Tutor({
                        email: newEmail,
                        password: pass,
                        fName: firstName,
                        lName: lastName,
                        zoom: "",
                        monday: [],
                        tuesday: [],
                        wednesday: [],
                        thursday: [],
                        friday: [],
                        saturday: [],
                        sunday: [],
                        subject: "",
                        students: [],
                        apptDates: [],
                        apptTimes: []
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
    if (req.session.user) {
        const day = req.query.DAY
        const index = req.query.INDEX
        console.log(day);
        console.log(index);
        // Implement Delete
        Tutor.findOne({email: req.session.user.email}, function(err, foundTutor) {
            if (err){
                console.log(err);
            }
            else {
                console.log(foundTutor[day]);
                foundTutor[day].splice(index, 2)
                console.log(foundTutor[day]);
                foundTutor.save()
                res.redirect("/tutor")           
            }
        })        
    }
    else {
        req.flash('message', "You have been logged out. Please log back in")
    }
    
})

app.post('/subject', function(req,res){
    const subject = req.body.subjects
    Tutor.findOne({email: req.session.user.email}, function(err, foundTutor){
        if (err){
            console.log(err);
        }
        else {
            foundTutor.subject = subject
            foundTutor.save()
            res.redirect("/tutor")
        }
    })
})

app.post('/zoom', function(req,res){
    Tutor.findOne({email: req.session.user.email}, function(err, foundTutor){
        if (err){
            console.log(err);
        }
        else{
            foundTutor.zoom = req.body.zoomLink
            foundTutor.save()
            res.redirect('/tutor')
        }
    })
})

app.post('/schedule', function(req, res) {
    var email=""
    var id = ""
    const date = req.body.apptDate
    const subject = req.body.subjects
    console.log("From Input: ");
    console.log(subject);
    const time = req.body.time
    const newDate=date.slice(0,4)+"/"+date.slice(5,7)+"/"+date.slice(8,10)
    console.log(newDate)
    const dayofWeek= new Date(newDate).getDay()
    const days=["sunday","monday","tuesday","wednesday","thursday","friday", "saturday"]
    if (parseInt(time.slice(3,5)) % 5 != 0){
        req.flash('message', 'Minutes is not in an interval of 5')
        res.redirect("/student")
    }
    else{
    Tutor.find({},function(err,tutors){
        if(err){ 
            console.log(err)
        }
        else{
            var found = false;
            for (var i = 0; i < tutors.length; i++) {
                for (var j = 0; j < tutors[i][days[dayofWeek]].length;j=j+3){
                    console.log("from database: ");
                    console.log(tutors[i].subject)
                    console.log(parseInt(time.slice(0,2))==parseInt(tutors[i][days[dayofWeek]][j].slice(0,2)))
                    console.log(parseInt(time.slice(3,5))==parseInt(tutors[i][days[dayofWeek]][j].slice(3,5)))
                    if (parseInt(time.slice(0,2))==parseInt(tutors[i][days[dayofWeek]][j].slice(0,2)) 
                    && parseInt(time.slice(3,5))==parseInt(tutors[i][days[dayofWeek]][j].slice(3,5)) 
                    && subject == tutors[i].subject && tutors[i][days[dayofWeek]][j+2] != true) {
                        console.log("from database: ");
                        console.log(tutors[i].subject)
                        tutors[i].apptDates.push(newDate)
                        tutors[i].apptTimes.push(time)
                        var militaryToTwelve = convert_military_to_twelve(time)
                        console.log(militaryToTwelve)
                        tutors[i][days[dayofWeek]][j+2] = true
                        tutors[i].students.push(req.session.user.fName + " " +req.session.user.lName)
                        id = tutors[i].zoom
                        tutors[i].save()
                        found = true
                        email=tutors[i].email
                        Student.findOne({email:req.session.user.email},function(err,foundStudent){
                            if(err){
                                console.log(err)
                            }
                            else{
                                foundStudent.appts.push(newDate)
                                foundStudent.appts.push(time)
                                foundStudent.appts.push(id)
                                
                                foundStudent.save()
                                var mailOptions = {
                                    from: 'tutorfirstinc@gmail.com',
                                    to: email,
                                    subject: 'You Have Been Matched!',
                                    text: 'You have an appointment on '+newDate+" at "+time+" with "+foundStudent.fName+" "+foundStudent.lName
                                  };
                                  
                                transporter.sendMail(mailOptions, function(error, info){
                                    if (error) {
                                      console.log(error);
                                    } else {
                                      console.log('Email sent: ' + info.response);
                                    }
                                });
        
                            }
                        })



                        res.redirect("/student")
                    }
                }
                if(found){
                    break;
                }
            }
            if (!found){
                req.flash('message', "No tutor is available at this time slot")
                res.redirect('/student')
            }
        }
    })
}
})

app.post("/addAvail", function(req,res) {
    var day = req.body.days
    day = day.toLowerCase()
    console.log(day);   
    const startTime = req.body.startTime
    const endTime = req.body.endTime
    console.log(parseInt(startTime.slice(3,5)))
    console.log(parseInt(endTime.slice(3,5)))

    console.log(parseInt(startTime.slice(3,5)) % 5 != 0)
    //6:55 - 7:56
    //GOTTA FIX THIS
    if (parseInt(startTime.slice(3,5)) % 5 != 0 || parseInt(endTime.slice(3,5)) % 5 != 0){ //if start min is not interval of 5
        if ( (parseInt(startTime.slice(0,2))+1 != parseInt(endTime.slice(0,2))) 
        && (parseInt(startTime.slice(3,5)) != parseInt(endTime.slice(3,5)))){ // if its not 1 hr
            req.flash('message', 'Minutes is not in an interval of 5 and it is not one hour')
            console.log("here1")
            res.redirect('/tutor')
            
        }
        else{
            req.flash('message', 'Minutes is not in an interval of 5')
            console.log("here2")
            res.redirect('/tutor')
        }
    }          //7                                      7                                      
    else if( (parseInt(startTime.slice(0,2))+1 != parseInt(endTime.slice(0,2))) && (parseInt(startTime.slice(3,5)) != parseInt(endTime.slice(3,5))) ){ //if its not 1 hr
        if ( parseInt(startTime.slice(3,5)) % 5 != 0){ // if start min is not interval of 5
            req.flash('message', "Minutes is not an interval of 5 and it is not one hour")
            console.log("here3")
            res.redirect('/tutor')
        }
        else {
            req.flash('message', 'Not one hour')
            console.log("here4")
            res.redirect('/tutor')
        }  
        
            
    }
    else if((parseInt(startTime.slice(3,5)) != parseInt(endTime.slice(3,5))) ){
        if((parseInt(startTime.slice(3,5)) % 5 != 0 || parseInt(endTime.slice(3,5)) % 5 != 0) && (parseInt(startTime.slice(0,2))+1 != parseInt(endTime.slice(0,2)))){
            req.flash('message',"Minutes is not an interval of 5 and it is not one hour")
            console.log("here5")
            res.redirect('/tutor')
        }
        else{
            req.flash('message', 'Not an hour')
            console.log("here6")
            res.redirect('/tutor')
        }
    }
    
    else {
        Tutor.findOne({email: req.session.user.email}, function(err, foundTutor){
            if (err){
                console.log(err);
            }
            else {
                var failed= false
                for (var i = 0; i < foundTutor[day].length; i=i+3){
                    if ( parseInt(foundTutor[day][i].slice(0,2)) == parseInt(startTime.slice(0,2)) ) { // if hour is equal
                            failed = true
                            console.log("hey");
                            req.flash('message', "Already occupied!")
                            res.redirect('/tutor')
                        }
                }
                if (failed == false){
                    foundTutor[day].push(startTime)
                    foundTutor[day].push(endTime)
                    foundTutor[day].push(false)
                    foundTutor.save()
                    res.redirect("/tutor")
                }
            }
        })
    }
})

app.get("/logout", function(req, res) {
    req.session.reset();
    res.redirect("/")
})

server.listen(3000,function(){
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

