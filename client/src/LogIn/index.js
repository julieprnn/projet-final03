import React, {useState} from "react";
import './index.css';
//import fonds from './Utils/IMG_4947.png';
import styled from "styled-components";

const Fond = styled.div`
position: absolute;
width: 1440px;
height: 1024px;
left: 0px;
top: 0px;

background: #F9D6B6;
`;

const Image =styled.div`
position: absolute;
width: 769px;
height: 1024px;
left: -16px;
top: 0px;

background: url(IMG_4947.jpg);
opacity: 0.7;
`
;

export default function Login() {
    const [email,setEmail] = useState("");
    const [password,setPassWord] = useState("");

    function validateForm() {
        return email.lenght > 0 && password.lenght > 0;
    }

    // A quoi sert cette fct ?
    function handleSubmit(event) {
        event.preventDefault();
    }

    return (
        <Fond>
            <div className="Login">

             </div>
        </Fond>
       
        
    );
}