import React, {useState} from "react";

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

    /*
    return (
        <div className="Login">
        <Form onSubmit={handleSubmit}>
            <Form.Group size="lg" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            </Form.Group>
            <Form.Group size="lg" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            </Form.Group>
            <Button block size="lg" type="submit" disabled={!validateForm()}>
            Login
            </Button>
        </Form>
        </div>
        
    );
    */
}