import React, {Component} from 'react'
import "../styles/pages/user.sass";
import axios from "axios";
import {getCookie} from "../methods/Functions";
import {withRouter} from "../methods/WithRouter";
import BookList from "../blocks/BookList";
import ActionList from "../blocks/ActionList";
import SVGs from "../methods/SVGs";

class UserPage extends Component {
    constructor(props) {
		super(props);
		this.state  = {
			ownPage: false,
			messages: [],
			section: 'books',
			isOnline: false,
			updatingMessages: false
		};
		this.svgs = new SVGs();
		this.updateUser = this.updateUser.bind(this);
		this.updateMessages = this.updateMessages.bind(this);
		this.sendMessage = this.sendMessage.bind(this);
	}

	componentDidMount() {
		if (this.props.user.id === this.props.params.userId) {
			this.setState({ownPage: true})
		}
		this.updateUser();
		this.updateMessages();
	}

	updateUser(){
		axios.post('/get_user_full',
			{user_id: this.props.params.userId},
			{headers: {"X-CSRFToken": getCookie('csrftoken')}})
			.then(json => {
				if (json.data.success) {
					const lastSeen = new Date(json.data.user_data.last_seen);
					this.setState({
						user_page_data: json.data.user_data,
						ownPage: this.props.user.id === json.data.user_data.id,
						isOnline: (Date.now() - lastSeen)/1000 < 300,  // last seen less than 5 mins ago
					})

				} else {
					this.setState({error_message: json.data.message});
				}
			})
		this.updateMessages();
	}

	updateMessages(){
		axios.post('/get_messages',
			{user_companion_id: this.props.params.userId},
			{headers: {"X-CSRFToken": getCookie('csrftoken')}})
			.then(json => {
				if (json.data.success) {
					this.setState({
						messages: json.data.messages
					}, () => {
						if (this.state.messages.length !== 0 && this.state.updatingMessages === false) {
							this.updateMessagesCountdown = setInterval(() => this.updateMessages(), 5000)
							this.setState({updatingMessages: true})
						}
					})
				} else {
					this.setState({error_message: json.data.message});
				}
			})
	}

	updateMessageInputValue = (event) => {
		this.setState({messageText: event.target.value});
	}

	componentWillUnmount = () => {
        if(this.updateMessagesCountdown) {
			clearInterval(this.updateMessagesCountdown);
		}
    }

	sendMessage(){
		if (this.state.messageText) {
			axios.post('/create_message',
				{
					user_companion_id: this.props.params.userId,
					message_text: this.state.messageText,
				},
				{headers: {"X-CSRFToken": getCookie('csrftoken')}})
				.then(json => {
					if (json.data.success) {
						this.setState({
							messages: json.data.messages,
							messageText: ''
						})
					} else {
						this.setState({error_message: json.data.message});
					}
				})
		}
	}

	rejectOrder(orderId){
        axios.post('/reject_order',
            {order_id: orderId},
            {headers: {"X-CSRFToken": getCookie('csrftoken')}})
            .then(json => {
                if (json.data.success) {
                    this.updateMessages();
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
                    this.updateMessages();
                } else {
                    this.setState({error_message: json.data.message});
                }
            })
    }

	render() {
		return <>
			<div className={'userPage'}>
				<div className={'container'}>
					<div className={'profile'}>
						<img className={'avatar'}
							 src={(this.state.user_page_data && this.state.user_page_data.avatar && this.state.user_page_data.avatar !== 'default_avatar.png') ? this.state.user_page_data.avatar : "/user.png"}
							 alt={'avatar'}/>
						<div className={'userInfo'}>
							<h1>
								{this.state.user_page_data ? this.state.user_page_data.first_name : 'Пользователь'}
							</h1>
							<p>
								Передано книг: {this.state.user_page_data ? this.state.user_page_data.closed_from_orders_count : 0}
							</p>
							<p>
								Получено книг: {this.state.user_page_data ? this.state.user_page_data.closed_to_orders_count : 0}
							</p>
						</div>
					</div>
					{this.state.messages.length === 0 ?
						<div className={'mainContent'}>
							<div className={'bookListOuter'}>
								<h2>Книги</h2>
								{this.state.user_page_data &&
									<BookList books={this.state.user_page_data.books_available}
											  user={this.props.user}
											  updateUser={this.props.updateUser}
											  onUpdate={() => {
												  this.updateUser()
											  }}/>}
							</div>
							<div className={"actionListContainer"}>
								<h2>Действия</h2>
								{this.state.user_page_data &&
									<ActionList userPage={this.state.user_page_data}
												user={this.props.user}
												onUpdate={() => {
													this.updateUser()
												}}/>}
							</div>
						</div> :
						<div className={'mainContentWithMessages'}>
							<div className={'bookListOrActions'}>
								<div className={'bookListOrActionsHeader'}>
									<h2 onClick={()=>{this.setState({section: 'books'})}}
										style={(this.state.section === 'books' ? {} : {color: '#828282'})}>
										Книги
									</h2>
									<h2 onClick={()=>{this.setState({section: 'actions'})}}
										style={(this.state.section === 'actions' ? {} : {color: '#828282'})}>
										Действия
									</h2>
								</div>
								{(this.state.user_page_data && this.state.section === 'books') &&
									<BookList books={this.state.user_page_data.books_available}
											  user={this.props.user}
											  updateUser={this.props.updateUser}
											  onUpdate={() => {
												  this.updateUser()
											  }}/>}
								{(this.state.user_page_data && this.state.section === 'actions') &&
									<ActionList userPage={this.state.user_page_data}
												user={this.props.user}
												onUpdate={() => {
													this.updateUser()
												}}/>}
							</div>
							{this.state.user_page_data &&
								<div className={'messagesOuterContainer'}>
									<div className={'userHeaderContainer'}>
										<div className={'avatarContainer'}>
											<img className={'avatarMessages'}
												 src={(this.state.user_page_data.avatar && this.state.user_page_data.avatar !== 'default_avatar.png') ? this.state.user_page_data.avatar : "/user.png"}
												 alt={'avatar'}/>
											{this.state.isOnline &&
												<div className={'avatarSvgContainer'}>{this.svgs.isOnline}</div>}
										</div>
										<div className={'userDataMessages'}>
											<h2>{this.state.user_page_data.first_name}</h2>
											{this.state.isOnline ?
												<p className={'online'}>Онлайн</p> :
												<p>
													{Intl.DateTimeFormat('ru-Ru', {
														year: 'numeric', month: 'numeric', day: 'numeric',
														hour: "numeric", minute: "numeric"
													}).format(new Date(this.state.user_page_data.last_seen))}
												</p>
											}
										</div>
									</div>
									<div className={"messagesContainer"}>
										{this.state.messages.map((message)=>{
											return <div className={message.from_user == this.props.params.userId ? 'messageContainer' : 'ownMessageContainer'}>
												{message.order ?
													<>
														<p>
															По поводу книги&nbsp;
															<b>{message.order.book_available.book.title}</b>: <br/>
															{message.text}
														</p>
														{(message.order && !message.order.rejected) &&
															(message.order.from_user.id == this.props.user.id ?
																(!message.order.accepted_by_from_user &&
																	<div className={'actionButtons'}>
																		<button className={'accept'}
																				onClick={()=>{this.acceptOrder(message.order.id)}}>
																			Передал(-а)
																		</button>
																		<button className={'reject'}
																				onClick={()=>{this.rejectOrder(message.order.id)}}>
																			Отказать
																		</button>
																	</div>) :
																(!message.order.accepted_by_to_user &&
																	<div className={'oneButtonContainer'}>
																		<button className={'accept'}
																				onClick={()=>{this.acceptOrder(message.order.id)}}>
																			Получил(-а)
																		</button>
																	</div>)
															)}
													</> :
													<p>
														{message.text}
													</p>
												}
											</div>
										})}
									</div>
									<div className={'messageInputContainer'}>
										<input type={'text'} placeholder={'Введите сообщение'}
											   onChange={this.updateMessageInputValue}
											   value={this.state.messageText}/>
										<div className={'sendMessageButton'} onClick={()=>{this.sendMessage()}}>
											{this.svgs.telegram}
										</div>
									</div>
								</div>
							}
						</div>
					}
				</div>
			</div>
		</>
    }
}

export  default  withRouter(UserPage);