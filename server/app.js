// load dependencies
const app = require("express")();
const http = require("http").Server(app);
const mongoose = require("mongoose");
const io = require("socket.io")(http);
require("dotenv");

// set initial variables
const { PORT } = process.env;
const dev = process.env.NODE_ENV !== "production";
const root = dev ? `http:localhost:${PORT}` : process.env.PRODUCTION_URL;

// mongoose configuration
const mongooseConfig = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
};

// connect to database
mongoose
  .connect(process.env.MONGO_URI, mongooseConfig)
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.log(`Connection Error: ${error.message}`));

// create mongoose collection
const Schema = mongoose.Schema;
const Chat = mongoose.model(
  "Chat",
  new Schema({ name: String, message: String })
);

// listen on server
http.listen(PORT, (request, response) => console.log(`Running on ${root}`));

// connect to socket io
io.on("connection", server => {
  // create function to send status (of chat object) to client
  const sendStatus = chatStatus => {
    server.emit("status", chatStatus);
  };

  // get chats from mongo collection
  Chat.find()
    .limit(100)
    .sort({ _id: 1 })
    .exec((error, chat) => {
      if (error) {
        throw error;
      }

      // send chat object to the client
      server.emit("output", chat);
    });

  // handle input event (chat object) from the client
  server.on("input", chat => {
    const { name, message } = chat;
    // check name and message property (of chat object)
    if (name === "" || message === "") {
      // send error status string to client if either property is empty
      sendStatus("Please enter a name and message");
    } else {
      // otherwise, insert the message into the database
      Chat.insertMany({ name, message }, () => {
        /****  THE LINE BELOW HAS BEEN CHANGED FROM THE PREVIOUS FILE EXAMPLE  *****/
        server.emit("output", chat);

        // send success status object to client
        sendStatus({ message: "Message sent", clear: true });
      });
    }
  });

  // handle clear event
  server.on("clear", data => {
    // remove all chat objects from the database
    Chat.deleteMany({}, () => {
      // send clear success status string to client
      server.emit("cleared");
    });
  });
});
