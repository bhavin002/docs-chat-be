const mongoose = require('mongoose');

exports.connection = () => {
    try {
        mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to the database");
    } catch (error) {
        console.log("Error connecting to the database");
    }
}