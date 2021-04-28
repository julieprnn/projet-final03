import React from "react";
import { Route, Switch } from "react-router-dom";
import { AccountBox } from "./AccountBox";
import ComponentTest from "./ComponentTest";
import Login from "./LogIn";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/users">
      
      </Route>

      <Route exact path="/users/login">
          <Login/>
          </Route>

      <Route exact path ='/test'>
          <ComponentTest/>
      </Route>

      <Route exact path='/accountbox'>
          <AccountBox/>
      </Route>

    </Switch>
  );
}