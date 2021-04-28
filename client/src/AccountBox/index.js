import React, {useState} from "react";
import './index.css';
import styled from "styled-components";

const Fond = styled.div`
position: absolute;
width: 769px;
height: 1024px;
left: -16px;
top: 0px;

background: url(IMG_4947.jpg);
opacity: 0.7;
`;

const BoxContainer = styled.div`
position: absolute;
width: 688px;
height: 1024px;
left: 752px;
top: 0px;

background: #F9D6B6;

`;

const Title = styled.div`
width: 473px;
height: 214px;
left: 812px;
top: 228px;

font-family: Anonymous Pro;
font-style: normal;
font-weight: normal;
font-size: 64px;
line-height: 64px;

color: #000000;
`;

const SubTitle = styled.div`
width: 502px;
height: 96px;
left: 812px;
top: 479px;

font-family: Anonymous Pro;
font-style: normal;
font-weight: normal;
font-size: 24px;
line-height: 24px;

color: #000000;
`;

export function AccountBox(props) {

    return (
        <BoxContainer>
            <Title>Rejoignez Birdy aujourd’hui</Title>
            <SubTitle>Et partagez vos plus belles lectures !</SubTitle>
        </BoxContainer>
        
    );

}



