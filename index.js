const express = require('express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const port =process.env.port || 3000
const app = express()

var temp_data;
var data_display;
var admin_data;
var mark_up;

//handlers

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cookieParser('secret'))
app.use(session({cookie: {maxAge: null}}))

app.use((req, res, next)=>{
    res.locals.message = req.session.message
    delete req.session.message 
    next()
  })
//app.engine('hbs', handlebars.engine)
app.set('view engine', 'hbs')

//db

mongoose.connect('mongodb://localhost:27017/mydb',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"))

//controller-hbs

app.get("/pc",(req,res)=>{
    res.render("ch_pass",{
        data : data_display,
    });
})

app.get("/log",(req,res)=>{
    res.render("login");
})

app.get("/sig",(req,res)=>{
    res.render("register");
})

app.get("/sh",(req,res)=>{
    res.render("stud_home",{
        stud_name:temp_data,
        data:data_display,
    }
    );
})

app.get("/ss",(req,res)=>{
    res.render("stud_sub",{
        data:data_display,
    }
    );
})

app.get("/admin",(req,res)=>{
    console.log('succ')
    res.render("admin",{
        data : admin_data,
     });
    
})

app.get("/del/:id",(req,res)=>{
    console.log(req.params.id)
    try{
    db.collection('users').deleteOne({Roll_no:req.params.id})
    console.log('DELETE SUCCESSFULL!!')

    db.collection('users').find({}).toArray((err,collection)=>{
        if(err){
            throw err;
        }
        try
        {
            admin_data=collection;
            console.log(collection)
            console.log('records successfully found!!')
           
        }
        catch
        {
            console.log('records couldnt be found found!!')
        }
    })

    res.redirect("/admin")

    }
    catch{
        console.log('DELETE UNSUSSFULL!')
    }
})

app.get("/md",(req,res)=>{
    res.render("marks",{
        data:mark_up,
    });
})


app.get("/marks_update/:id",(req,res)=>{
    console.log(req.params.id)
    db.collection('users').findOne({ "Roll_no": req.params.id },(error,collection)=>{
        if(error){
            console.log(error)
        }
        try{
            mark_up=collection;
            console.log(mark_up);
            console.log("Record found Successfully");
            res.redirect('/md')
        }
        catch{
            console.log("Record found UnSuccessfully");
        }


    })

   
})

//controller-db

app.post("/sign_up",(req,res)=>{
    var name = req.body.name;
    var email = req.body.email;
    var rno = req.body.rno;
    var password = req.body.password;
    var pass;

    db.collection('users').findOne({ "Roll_no": rno },(error,collection)=>{
        if(error){
            console.log(error)
        }
    try{
        pass=collection.name;
        console.log("Record Inserted failed");
        console.log(pass);
        console.log(rno);
        console.log("Record found Successfully");

        req.session.message= {
            type: 'danger',
            intro: 'Roll number already exists! ',
            message: 'Please make sure to insert the right roll number.'
        }
        
          
        res.redirect("/sig")

    }
    catch{

    var data = {
        "name": name,
        "email" : email,
        "Roll_no": rno,
        "password" : password,
        "m1" : "np",
        "m2" : "np",
        "m3" : "np",
        "m4" : "np",
        "m5" : "np"
    }

    db.collection('users').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        console.log("Record Inserted Successfully");
        req.session.message= {
            type: 'success',
            intro: 'You are registered! ',
            message: 'You can log in.'
        }
          
        res.redirect("/log")
    });
    }

   // return res.redirect('signup_success.html')
})

})

//ff

app.post("/login",(req,res)=>{
    
    var rno = req.body.rno;
    var password = req.body.password;
    var pass;
    
    if(rno=="admin" && password=="admin")
    {
        db.collection('users').find({}).toArray((err,collection)=>{
            if(err){
                throw err;
            }
            try
            {
                admin_data=collection;
                console.log(collection)
                console.log('records successfully found!!')
               
            }
            catch
            {
                console.log('records couldnt be found found!!')
            }
        })

        res.redirect("/admin")

    }
    else
    {
    db.collection('users').findOne({ "Roll_no": rno },(error,collection)=>{
        if(error){
            console.log(error)
        }
        try{
        pass=collection.password;
        data_display=collection;
        console.log(pass);
        console.log(password);
        console.log("Record found Successfully");
        console.log(data_display);
        if(pass==password)
    {
        
      //  return res.redirect('login_success.html')
        req.session.message= {
        type: 'success',
        intro: 'You have loged in! ',
        message: 'successfully loged in.'
      }
      console.log('success')
      temp_data=collection.name;
      console.log(temp_data)
      res.redirect("/sh")
    }
    else
    {
       // return res.redirect('unsuccess.html')
       req.session.message = {
        type: 'danger',
        intro: 'Passwords do not match! ',
        message: 'Please make sure to insert the right password.'
      }
      console.log('fail')
      res.redirect("/log")
    }
    }
    catch{

        req.session.message = {
            type: 'danger',
            intro: 'Roll-number do not match! ',
            message: 'Please make sure to insert the right Roll-number.'
          }
          console.log('fail')
          res.redirect("/log")
    }
    });
}
})


//stud

app.post("/chps",(req,res)=>{
    var op = req.body.O_password;
    var np = req.body.N_password;
    var cp = req.body.C_password;
    var dt={Roll_no:data_display.Roll_no}
    var up={password:np}

    if(op==data_display.password && np==cp)
    {
        db.collection('users').updateOne(dt,{$set:{password:np}});

        req.session.message= {
            type: 'success',
            intro: 'Password changed! ',
            message: 'successfully Changed.'
          }
        console.log("op:"+op+"||"+data_display.password)
        console.log(np+"||"+cp)
        res.redirect("/pc")

    }
    else
    {
        req.session.message= {
            type: 'danger',
            intro: 'Password do not match! ',
            message: 'Please make sure to insert the right password.'
          }
        console.log("rongh credentials")
        res.redirect("/pc")
    }


})

app.post("/marksup",(req,res)=>{
    var ma1 =req.body.m1;
    var ma2 =req.body.m2;
    var ma3 =req.body.m3;
    var ma4 =req.body.m4;
    var ma5 =req.body.m5;
    var dt ={ Roll_no:mark_up.Roll_no}
    
   try{
    db.collection('users').updateOne(dt,{$set:{
        m1:ma1,
        m2:ma2,
        m3:ma3,
        m4:ma4,
        m5:ma5
    }});
    console.log('update successfull!!!')
    mark_up="null";

    res.redirect("/admin")
}
catch{

}
console.log('update Unsuccessfull!!!')
})

//basic
app.get("/",(req,res)=>{
    temp_data="null";
    data_display="null";
    console.log(data_display)
    res.render("index");
})

app.listen(port,()=>{
    console.log('accuired port number is '+ port)
})