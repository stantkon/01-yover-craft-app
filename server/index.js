
const express = require('express');
const mongoose = require('mongoose');
const config = require('config');

const app = express();
const PORT = 5000;

const start = async () =>{
    try{
        mongoose.connect()

        app.listen(PORT, () => {
            console.log(`Listening on port ${PORT}`);
        })
    }catch(err){

    }
}

start();