import React, {Component} from 'react';
import "../styles/blocks/loginpopup.sass";
import SVGs from "../methods/SVGs";
import axios from "axios";
import {getCookie} from "../methods/Functions";


class RemoveBookPopup extends Component {
    constructor() {
        super();
        this.state = {
            showTgLogin: true
        }
        this.svgs = new SVGs();
    }

    handleDeleteBook = () => {
        axios.post('/remove_book',
            {book_id: this.props.book.id},
            {headers: {"X-CSRFToken": getCookie('csrftoken')}})
            .then(json => {
                if (json.data.success) {
                    this.props.close();
                } else {
                    this.setState({error_message: json.data.message});
                }
            })
    };

    render() {
        return <>
            <div className={"background"}>
                <div className={"container"}>
                    <div className={"cross"} onClick={this.props.close}>
                        {this.svgs.cross}
                    </div>
                    <div className={"deleteBookContainer"}>
                        <p className={"deleteBookText"}>Вы уверены, что хотите удалить
                            книгу <b>{this.props.book.book.author.first_name} {this.props.book.book.author.last_name} - {this.props.book.book.title}</b>?
                        </p>
                        <button className={"deleteBookButton"} onClick={() => {this.handleDeleteBook()}}>
                            <h1>
                                Да, уверен
                            </h1>
                        </button>
                    </div>
                </div>
            </div>
        </>
    }
}

export default RemoveBookPopup;