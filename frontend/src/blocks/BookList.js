import React, {Component} from 'react';
import "../styles/blocks/booklist.sass";
import SVGs from "../methods/SVGs";
import RemoveBookPopup from "./RemoveBookPopup";
import LoginPopup from "./LoginPopup";
import CreateOrderPopup from "./CreateOrderPopup";


class BookList extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.svgs = new SVGs();
    }

    handleClickOnBook(bookAvailable){
        if (bookAvailable.user.id === this.props.user.id) {
            this.setState({showRemoveBook: true, bookRemoving: bookAvailable})
        } else if (this.props.user.is_anonymous) {
            this.setState({showLogin: true})
        } else {
			this.setState({
				showCreateOrder: true,
				bookOrdering: bookAvailable
			});
		}
    }

    render() {
        return <>
            <div className={'bookList'}>
                {this.props.books.map((bookAvailable, index) => {
                    return <div className={'bookContainer'} onClick={() => {this.handleClickOnBook(bookAvailable)}}>
                        <h2>
                            {bookAvailable.book.title}
                        </h2>
                        <p>
                            {bookAvailable.book.author.first_name} {bookAvailable.book.author.last_name}
                        </p>
                        {(index !== this.props.books.length - 1) &&
                            <hr />}
                    </div>
                })}
            </div>
            {this.state.showRemoveBook && <RemoveBookPopup close={() => {
                this.setState({showRemoveBook: false});
                this.props.onUpdate();
            }}
                                                           updateUser={this.props.updateUser}
                                                           book={this.state.bookRemoving}
                                                           user={this.props.user}/>}
            {this.state.showLogin && <LoginPopup close={() => {
                this.setState({showLogin: false});
                this.props.onUpdate();
            }}
                                                 updateUser={this.props.updateUser}
                                                 user={this.props.user}/>}
            {this.state.showCreateOrder && <CreateOrderPopup close={() => {
                this.setState({showCreateOrder: false})
                this.props.onUpdate();
            }}
                                                             user={this.props.user}
                                                             bookOrdering={this.state.bookOrdering}/>}
        </>
    }
}

export  default  BookList;