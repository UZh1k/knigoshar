import React, {Component} from 'react';
import "../styles/blocks/loginpopup.sass";
import SVGs from "../methods/SVGs";
import axios from "axios";
import TelegramLoginButton from 'react-telegram-login';
import {getCookie} from "../methods/Functions";

class LoginPopup extends Component {
    constructor() {
        super();
        this.state = {
            showTgLogin: true
        }
        this.svgs = new SVGs();
        this.updateName = this.updateName.bind(this);
    }

	componentDidMount() {
		axios.get('/get_user').then(result=>{
			this.setState({books: result.data})
		})
	}

    handleTelegramResponse = (response) => {
        axios.post('/telegram_login',
            {init_data: JSON.stringify(response)},
            {headers: {"X-CSRFToken": getCookie('csrftoken')}})
            .then(json => {
                if (json.data.success) {
                    this.props.updateUser(json.data.user_data);
                    if (json.data.user_created) {
                        this.setState({
                            showTgLogin: false,
                            name: json.data.user_data.first_name
                        })
                    } else {
                        this.props.close();
                    }
                } else {
                    this.setState({error_message: json.data.message});
                }
            })
    };

    updateInputValue(evt) {
        this.setState({
            name: evt.target.value
        });
    }

    updateName() {
        axios.post('set_name',
            {name: this.state.name},
            {headers: {"X-CSRFToken": getCookie('csrftoken')}})
            .then(json => {
                if (json.data.success) {
                    this.props.updateUser(json.data.user_data);
                    this.props.close();
                } else {
                    this.setState({error_message: json.data.message});
                }
            })
    }

    render() {
        return <>
            <div className={"background"}>
                <div className={"container"}>
                    <div className={"cross"} onClick={this.props.close}>
                        {this.svgs.cross}
                    </div>
                    <h1>Аутентификация</h1>
                    {this.state.showTgLogin ?
                        <div className={"tgButton"}>
                            <TelegramLoginButton dataOnauth={this.handleTelegramResponse}
                                                 botName="knigoshar_bot"
                                                 usePic={true}/>
                        </div> :
                        <div className={"nameInput"}>
                            <p>
                                Для завершения регистрации<br/>
                                введите ваше <b>имя</b>
                            </p>
                            <input type={"text"}
                                   value={this.state.name}
                                   placeholder={"Ваше имя"}
                                   onChange={evt => this.updateInputValue(evt)}/>
                            <input type={"button"}
                                   className={"acceptButton"}
                                   value={"Сохранить имя"}
                                   onClick={this.updateName}/>
                        </div>
                    }
                </div>
            </div>
        </>
    }
}

export default LoginPopup;