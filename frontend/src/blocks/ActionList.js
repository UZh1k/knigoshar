import React, {Component} from 'react';
import "../styles/blocks/actionlist.sass";
import SVGs from "../methods/SVGs";
import axios from "axios";
import {getCookie} from "../methods/Functions";


class ActionList extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.svgs = new SVGs();
        this.rejectOrder = this.rejectOrder.bind(this);
        this.acceptOrder = this.acceptOrder.bind(this);
    }

    componentDidMount() {
        const allOrders = this.props.userPage.from_orders.concat(this.props.userPage.to_orders);
        this.setState({allOrders});
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps !== this.props) {
            const allOrders = this.props.userPage.from_orders.concat(this.props.userPage.to_orders);
            this.setState({allOrders});
        }
    }

    rejectOrder(orderId){
        axios.post('/reject_order',
            {order_id: orderId},
            {headers: {"X-CSRFToken": getCookie('csrftoken')}})
            .then(json => {
                if (json.data.success) {
                    this.props.onUpdate();
                } else {
                    this.setState({error_message: json.data.message});
                }
            })
    }

    acceptOrder(orderId){
        axios.post('/accept_order',
            {order_id: orderId},
            {headers: {"X-CSRFToken": getCookie('csrftoken')}})
            .then(json => {
                if (json.data.success) {
                    this.props.onUpdate();
                } else {
                    this.setState({error_message: json.data.message});
                }
            })
    }

    render() {
        return <>
            <div className={'actionList'}>
                {this.state.allOrders && this.state.allOrders.map((order, index) => {
                    let contentElement = <></>;
                    let time = null;
                    if (order.accepted_by_from_user && order.accepted_by_to_user){
                        time = order.date_close;
                        if (this.props.userPage.id === order.from_user.id){
                            contentElement = <p className={'orderText'}>
                                Передал(-а) книгу <b>{order.book_available.book.author.first_name}&nbsp;
                                {order.book_available.book.author.last_name} - {order.book_available.book.title}</b>&nbsp;
                                для <a href={`/user/${order.to_user.id}`}><b>{order.to_user.first_name}</b></a>
                            </p>
                        } else {
                            contentElement = <p className={'orderText'}>
                                Получил(-а) книгу <b>{order.book_available.book.author.first_name}&nbsp;
                                {order.book_available.book.author.last_name} - {order.book_available.book.title}</b>&nbsp;
                                от <a href={`/user/${order.from_user.id}`}><b>{order.from_user.first_name}</b></a>
                            </p>
                        }
                    } else if (order.rejected) {
                        time = order.date_close;
                        if (this.props.userPage.id === order.from_user.id){
                            contentElement = <p className={'orderText'}>
                                Отказал(-а) в передаче книги <b>{order.book_available.book.author.first_name}&nbsp;
                                {order.book_available.book.author.last_name} - {order.book_available.book.title}</b>&nbsp;
                                для <a href={`/user/${order.to_user.id}`}><b>{order.to_user.first_name}</b></a>
                            </p>
                        } else {
                            contentElement = <p className={'orderText'}>
                                Получил(-а) отказ в передаче книги <b>{order.book_available.book.author.first_name}&nbsp;
                                {order.book_available.book.author.last_name} - {order.book_available.book.title}</b>&nbsp;
                                от <a href={`/user/${order.from_user.id}`}><b>{order.from_user.first_name}</b></a>
                            </p>
                        }
                    } else {
                        time = order.date_open;
                        if (this.props.userPage.id === order.from_user.id){
                            contentElement = <>
                                <p className={'orderText'}>
                                    Получил(-а) запрос на книгу <b>{order.book_available.book.author.first_name}&nbsp;
                                    {order.book_available.book.author.last_name} - {order.book_available.book.title}</b>&nbsp;
                                    от <a href={`/user/${order.to_user.id}`}><b>{order.to_user.first_name}</b></a>
                                </p>
                                {(this.props.userPage.id === this.props.user.id && !order.accepted_by_from_user &&
                                    !order.rejected) &&
                                    <div className={'actionButtons'}>
                                        <button className={'accept'} onClick={()=>{this.acceptOrder(order.id)}}>
                                            Передал(-а)
                                        </button>
                                        <button className={'reject'}  onClick={()=>{this.rejectOrder(order.id)}}>
                                            Отказать
                                        </button>
                                    </div>
                                }
                            </>
                        } else {
                            contentElement = <>
                                <p className={'orderText'}>
                                    Запросил(-а) книгу <b>{order.book_available.book.author.first_name}&nbsp;
                                    {order.book_available.book.author.last_name} - {order.book_available.book.title}</b>&nbsp;
                                    у <a href={`/user/${order.from_user.id}`}><b>{order.from_user.first_name}</b></a>
                                </p>
                                {(this.props.userPage.id === this.props.user.id && !order.accepted_by_to_user &&
                                    !order.rejected) &&
                                    <div className={'oneButtonContainer'}>
                                        <button className={'accept'} onClick={()=>{this.acceptOrder(order.id)}}>
                                            Получил(-а)
                                        </button>
                                    </div>
                                }
                            </>

                        }
                    }
                    time = Intl.DateTimeFormat('ru-Ru', {
                        year: 'numeric', month: 'numeric', day: 'numeric',
                        hour: "numeric", minute: "numeric"
                    }).format(new Date(time));
                    return <div className={'actionContainer'}>
                        <p className={'time'}>{time}</p>
                        {contentElement}
                        {(index !== this.state.allOrders.length - 1) &&
                            <hr />}
                    </div>
                })}
            </div>
        </>
    }
}

export  default  ActionList;