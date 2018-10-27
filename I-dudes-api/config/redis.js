var redis = require('redis');
var redisClient = redis.createClient();

redisClient.on('ready', function () {
    console.log("Redis is ready");
});

redisClient.on('error', function () {
    console.log("Error in Redis");
});

module.exports =  redisClient;