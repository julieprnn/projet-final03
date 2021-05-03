import React from 'react';
import axios from 'axios';
import Jumbotron from "react-bootstrap/Jumbotron";
import Fond from '../Utils';
import Nav from "react-bootstrap/Nav";


// definition api
var api = axios.create({
  baseURL : 'http://localhost:4000/', 
  timeout : 1000,
  headers : {'Custom-Header' : 'NameHeader'}
});

export default class Home extends React.Component {
  state = {
    plumes: []
  }

  componentDidMount() {
    axios.get(`https://localhost:4000/`)
      .then(res => {
        console.log(res);
        const plumes = res.data;
        this.setState({ plumes });
      }) 
  }

  render() {
    return (
      <Fond>

        <h1>BIRDY</h1>

        

        <Nav defaultActiveKey="/home" className="flex-column">
  <Nav.Link href="/home">Active</Nav.Link>
  <Nav.Link eventKey="link-1">Rechercher</Nav.Link>
  <Nav.Link eventKey="link-2">Notifications</Nav.Link>
  <Nav.Link eventKey="disabled" disabled>
    Disabled
  </Nav.Link>
</Nav>
  
        </Fond>

    )
  }
}