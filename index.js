const express = require('express');
require('dotenv').config();
const port = process.env.PORT || 3000; 
const app = express();

app.get('/',(req,res)=>{
    res.send({message:"Working"});
})

app.listen(port,()=>{
    console.log(`Server Running on port ${port}`);
})