const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

app.set('views','./views');
app.set('view engine','pug');
app.use(express.static(path.join(__dirname, "static")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://vikasgo:Vikas0903@cluster0.gsfst.mongodb.net/<dbname>?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });

const nodemailer = require('nodemailer');
const randomstring = require("randomstring");
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'nodemailerapp.vikas@gmail.com',
        pass: 'nodemailer@123'
    }
});

app.get("/", (req, res) => {
    res.render('index')
})



app.post('/sendEmail',(req, res) => {
    let randomString = randomstring.generate({
        charset: 'abc',
        length: 7,
      });
    const linkTo = "http://localhost:8000/resetPassword/"+randomString;
    client.connect(err => {
        const collection = client.db("passwordExercise").collection("users");
              collection.findOne({userID:req.body.userID}, function(err, result) {
                if(result) {
                    const collectionOne = client.db("passwordExercise").collection("randomString");
                    collectionOne.insertOne({String:randomString, userName:req.body.userID}, ((err, res)=> {
                        if (err) throw err;
                        console.log(err)
                    }))
                    const mailOptions = {
                        from: 'nodemailerapp.vikas@gmail.com', // sender address (who sends)
                        to: req.body.userID, // list of receivers (who receives)
                        subject: 'Your Password Reset Link', // Subject line
                        text: 'Here is the Link to reset your Password', // plaintext body
                        html: '<b>Here is the Link</b><br><a href="'+linkTo+'">Please Click this link</a>'// html body
                    };
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function(error, info){
                            if(error){
                                return console.log(error);
                            }
                            console.log('Message sent: ' + info.response);
                        })
                        res.send("Email Sent Successfully")
                    } else {
                        res.send("Error sending Email")
                    }
           })
    })
})

app.get('/resetPassword/:randomString', ((req, res) => {
    client.connect(err => {
        const collection = client.db("passwordExercise").collection("randomString");
              collection.findOne({String:req.params.randomString}, function(err, result) {
                    if (err) throw err;
                    if(result) {
                        res.render('resetpassword',{data:result.String});
                    }
                    else {
                        res.send("UnAuthorized Action")
                    }
              })
            })
        }))

app.post('/newPassword', ((req, res) => {
    console.log(req.body)
    client.connect(err => {
        const collection = client.db("passwordExercise").collection("randomString");
              collection.updateOne({String:req.body.randomstring},{ $set: { password: req.body.newPassword }}, function(err, result) {
                    if (err) throw err;
                    console.log("Updated with new password")
            })
        const collectionOne = client.db("passwordExercise").collection("randomString");
        collectionOne.updateOne({String:req.body.randomstring},{ $unset: { String: 1 }}, function(err, result) {
            if (err) throw err;
            console.log("Deleted the random String")
            })
        })
        res.send("Done, Updated the new password")
}))

app.listen( 8000 || process.env.PORT)
