import React, {Component} from 'react';
import "../styles/blocks/header.sass";
import SVGs from "../methods/SVGs";
import LoginPopup from "./LoginPopup";
import {withRouter} from "../methods/WithRouter";


class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showLogin: false,
            user: {
                is_anonymous: true
            }
        }
        this.svgs = new SVGs();
        this.validateShare = this.validateShare.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props) {
            this.setState({
                user: this.props.user
            });
        }
    }

    validateShare = () => {
        if (this.state.user.is_anonymous) {
            this.setState({
                showLogin: true
            })
        } else {
            this.props.navigator('/add');
        }
    }


    render() {
        return <>
            <div className={"header"}>
                <h1 role="button" onClick={() => {
                    this.props.navigator('/')
                }} className={"title"}>
                    КнигоШар
                </h1>
                <button className={"searchButton"} onClick={() => {
                    this.props.navigator('/#search');
                    this.props.searchRef.current.scrollIntoView({behavior: "smooth"});
                }}>
                    <div className={"svgContainer"}>
                        {this.svgs.search}
                    </div>
                    Найти книгу
                </button>
                <button className={"shareButton"} onClick={this.validateShare}>
                    Поделиться книгами
                </button>
                {this.state.user.is_anonymous ?
                    <button className={"signinButton"} onClick={() => {
                        this.setState({showLogin: true})
                    }}>
                        Войти
                    </button> :
                    <img className={"avatarImage"}
                         src={(this.state.user.avatar && this.state.user.avatar !== "default_avatar.png")
                             ? this.state.user.avatar
                             : "/user.png"}
                         alt={'your avatar'}
                         onClick={() => {
                             this.props.navigator(`/user/${this.state.user.id}`)
                         }}/>
                }
            </div>
            {this.state.showLogin && <LoginPopup close={() => {
                this.setState({showLogin: false})
            }}
                                                 updateUser={this.props.updateUser}
                                                 user={this.props.user}/>}
        </>
    }
}

export default withRouter(Header);