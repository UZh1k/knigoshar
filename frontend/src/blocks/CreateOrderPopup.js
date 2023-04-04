import React, {Component} from 'react';
import "../styles/blocks/loginpopup.sass";
import SVGs from "../methods/SVGs";
import axios from "axios";
import {getCookie} from "../methods/Functions";
import {withRouter} from "../methods/WithRouter";


class CreateOrderPopup extends Component {
    constructor() {
        super();
        this.state = {
            messageText: ''
        }
        this.svgs = new SVGs();
    }

    handleCreateOrder = () => {
        if (this.state.messageText === ''){
            alert('Соообщение пустое');
        } else {
            axios.post('/create_order',
                {
                    message_text: this.state.messageText,
                    book_available_id: this.props.bookOrdering.id
                },
                {headers: {"X-CSRFToken": getCookie('csrftoken')}})
                .then(json => {
                    if (json.data.success) {
                        this.props.close();
                        this.props.navigator(`/user/${this.props.bookOrdering.user.id}`);
                    } else {
                        this.setState({error_message: json.data.message});
                    }
                })
        }
    };

    updateMessageTextValue(evt) {
        this.setState({
            messageText: evt.target.value
        });
    }
    
    render() {
        return <>
            <div className={"background"}>
                <div className={"container"}>
                    <div className={"cross"} onClick={this.props.close}>
                        {this.svgs.cross}
                    </div>
                    <div className={"orderBookContainer"}>
                        <p className={"orderBookText"}>
                            Напишите сообщение для <b>{this.props.bookOrdering.user.first_name}</b>,&nbsp;
                            чтобы договорится о передаче <b>{this.props.bookOrdering.book.author.first_name}&nbsp;
                            {this.props.bookOrdering.book.author.last_name} -&nbsp;
                            {this.props.bookOrdering.book.title}</b> на&nbsp;
                            <b>{this.props.bookOrdering.user.address.name.split(', ').at(-1)}</b>
                        </p>
                        <textarea className={'messageArea'} placeholder={'Введите сообщение'} 
                                  onChange={(event) => {this.updateMessageTextValue(event)}}/>
                        <div className={"orderBookButtonContainer"}>
                            <button className={"orderBookButton"} onClick={() => {this.handleCreateOrder()}}>
                                <h1>
                                    Запросить книгу
                                </h1>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    }
}

export default withRouter(CreateOrderPopup);