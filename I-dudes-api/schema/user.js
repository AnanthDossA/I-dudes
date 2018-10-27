//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var schema = mongoose.Schema;

var userSchema = new schema({
    mobile: String,
    imei: String,
    name: String,
    authentication: String
});


// Compile model from schema
var userModel = mongoose.model('user', userSchema);

// Create an instance of model SomeModel
var user = new userModel({ mobile: '9002354334', imei:'2467876543245',name:'aaaaaa', authentication:'fee434r43efrt34' });

// Save the new model instance, passing a callback
user.save(function (err, result) {
  if (err) return handleError(err);
  // saved!
});

userModel.find((err, res) => {
    console.log(err + " " + res);
});
module.exports = userModel;