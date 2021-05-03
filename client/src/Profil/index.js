import React from 'react';

import axios from 'axios';

class Profil extends React.Component {

    constructor(props){
        super(props)
        if(this.props.liste_ami === undefined){
            this.state={followed:false}
        }
        else{
            this.state={followed: this.props.liste_ami.find(ami=>ami.friend === this.props.owner) !== undefined}
        }
        console.log(this.props.liste_ami)
    }

    render () {
        var owner;
        var profilpage;
        return (
            <div >
                test
            </div>
        );

    }

}
