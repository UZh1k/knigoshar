import React, {Component} from 'react';
import { Outlet } from 'react-router-dom'
import Header from "./Header";
import Footer from "./Footer";
import "../styles/blocks/mainbody.sass";


class MainBody extends Component {
    constructor() {
        super();
        this.state = {}
    }
    render() {
        return <>
            <div className={'mainBody'}>
                <Header updateUser={this.props.updateUser}
                        user={this.props.user}
                        searchRef={this.props.searchRef}/>
                <Outlet/>
                <Footer/>
            </div>
        </>
    }
}

export  default  MainBody;