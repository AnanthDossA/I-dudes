//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1:27017/my_database';
mongoose.connect(mongoDB, { useNewUrlParser: true }).then((res)=>{
    console.log( 'Mongo is Ready');
}).catch((err)=>{
    console.log( 'MongoDB connection failed:Err logs below');
    console.log(err);
})
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var mongoClient = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
mongoClient.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = mongoClient;