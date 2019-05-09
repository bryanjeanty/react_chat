const app = require('express')();
const server = require('http').Server(app);
const mongoose = require('mongoose');
const io = require('socket.io')(server);
require('dotenv').config();

// mongoose configuration
const mongooseConfig = {
useNewUrlParser: true,
useCreateIndex: true,
useFindAndModify: false
}

// connect to database
mongoose
   .connect(process.env.MONGO_URI, mongooseConfig)
   .then(() => console.log("DB connected"))
   .catch(error => console.log(`DB connection error: ${error.message}`));

// create mongoose collection
const Schema = mongoose.Schema;
let Chat = mongoose.model('Chat', new Schema({ name: String, message: String }));

// set initial variables
const { PORT } = process.env;
const dev = process.env.NODE_ENV !== 'production';
const root = dev ? `http://localhost:${PORT}` : process.env.PRODUCTION_URL;

// setup socket.io server
server.listen(PORT, (request, response) => console.log(`Listening on ${root}`));

// render index.html file in root
app.get('/', (request, response) => {
response.sendFile('/home/bryan/Documents/New Documents/projects/ren_chat/client/index.html');
//response.sendFile(__dirname + '/../client/index.html');
});

// connect to socket io
io.on('connection', (socket) => {
// create function to send status
sendStatus = (s) => {
socket.emit('status', s)
}

// get chats from mongo collection
Chat.find().limit(100).sort({_id: 1}).exec((error, result) => {
if (error) {
throw error;
}

// emit the messages
socket.emit('output', result);
});

// handle input events
socket.on('input', (data) => {
let { name, message } = data;

// check for name and message
if ((name === '') || (message === '')) {
// send error status
sendStatus('please enter a name and message');
} else {
// insert message into db
Chat.insertMany({ name, message }, () => {
io.emit('output', [data]);

// send status of object
sendStatus({ message: 'Message sent', clear: true })
});
}
})

// handle clear
socket.on('clear', (data) => {
// remove all chats from collection
Chat.deleteMany({}, () => {
// emit cleared
socket.emit('cleared');
})
});
});
