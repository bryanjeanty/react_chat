import React from "react";
import ReactDOM from "react-dom";
import socket from "socket.io-client";
const client = socket("http://localhost:3000");

class HelloMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      message: "",
      chats: [],
      status: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.setStatus = this.setStatus.bind(this);
    this.checkSocketConnection = this.checkSocketConnection.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.clearChat = this.clearChat.bind(this);
  }

  componentDidMount() {
    this.checkSocketConnection();
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  setStatus(status) {
    if (status !== this.state.status) {
      this.setState({ status });
      setTimeout(() => {
        this.setState({ status: "" });
      }, 4000);
    }
  }

  checkSocketConnection() {
    if (client !== "undefined") {
      console.log("Connected to socket.io...");

      // handle chats array sent from server
      client.on("output", chats => {
        if (chats.length) {
          console.log(chats);
          const newChats = [...this.state.chats].concat(chats);
          this.setState({ chats: newChats });
        }
      });
    }
  }

  getStatus() {
    client.on("status", status => {
      // get message status from server and set it on client
      this.setStatus(typeof status === "object" ? status.message : status);

      // if status clear is true, clear the textarea field
      if (status.clear) {
        this.setState({ message: "" });
      }
    });
  }

  // send message as input to client
  sendMessage(event) {
    const { name, message } = this.state;
    if (event.which === 13 && event.shiftKey === false) {
      client.emit("input", { name, message });
      event.preventDefault();
      this.getStatus();
    }
  }

  // send event to server to delete all chat records from database
  clearChat() {
    client.emit("clear");
    client.on("cleared", () => {
      this.setState({ chats: [] });
    });
  }

  render() {
    const { name, message, status, chats } = this.state;

    const messageStyles = { height: 300 };

    return (
      <div className="container">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-sm-12">
            <h1 className="text-center">
              Ren Chat
              <button className="btn btn-danger" onClick={this.clearChat}>
                Clear
              </button>
            </h1>
            <div>{status}</div>
            <div>
              <input
                type="text"
                name="name"
                value={name}
                className="form-control"
                placeholder="Enter a name..."
                onChange={this.handleChange}
              />
              <br />
              <div className="card">
                <div style={messageStyles} className="card-block">
                  {chats ? (
                    chats.map(chat => (
                      <div key={chats.indexOf(chat)}>
                        <strong>{`${chat.name}: `}</strong>
                        {chat.message}
                      </div>
                    ))
                  ) : (
                    <div />
                  )}
                </div>
              </div>
              <br />
              <textarea
                name="message"
                value={message}
                className="form-control"
                placeholder="Enter a message..."
                onChange={this.handleChange}
                onKeyDown={this.sendMessage}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mountNode = document.getElementById("app");
ReactDOM.render(<HelloMessage />, mountNode);
