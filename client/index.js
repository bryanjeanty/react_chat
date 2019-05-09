import React from "react";
import ReactDOM from "react-dom";

class HelloMessage extends React.Component {
   render() {
      return <div>Hello {this.props.name}</div>;
   }
}

const mountNode = document.getElementById("root");
ReactDOM.render(<HelloMessage name="Bryan" />, mountNode);