import React, {Component} from 'react'
import "../styles/pages/main.sass";
import SVGs from "../methods/SVGs";
import Api from "../methods/Api";
import axios from 'axios';
import {Map, Placemark, YMaps} from "react-yandex-maps";
import LoginPopup from "../blocks/LoginPopup";
import RemoveBookPopup from "../blocks/RemoveBookPopup";
import CreateOrderPopup from "../blocks/CreateOrderPopup";


class MainPage extends Component {
    constructor(props) {
		super(props);
		this.state  = {
			placemarks: {},
			showLogin: false
		};
		this.svgs = new SVGs();
		this.api = new Api();
		this.handleScroll = this.handleScroll.bind(this);
		this.updateBookList = this.updateBookList.bind(this);
	}

	componentDidMount() {
		if (window.location.hash === '#search'){
			this.props.searchRef.current.scrollIntoView({behavior: "smooth"});
		}
		window.addEventListener('hashchange', this.handleScroll);
		this.updateBookList();
	}

	updateBookList(string) {
		const params = string ? {params: {title_or_author: string}} : {};
		axios.get('/books_available', params)
			.then(json => {
				let placemarks = {};
				let locationToCoords = {};
				json.data.map((item)=>{
					if (item.user.address.name in placemarks){
						placemarks[item.user.address.name].push(item);
					} else {
						placemarks[item.user.address.name] = [item];
						locationToCoords[item.user.address.name] = [item.user.address.latitude, item.user.address.longitude];
					}
				})
				this.setState({
					booksAvailable: json.data,
					placemarks,
					locationToCoords,
				});
			})
	}

	renderListOfBooksInBalloon(bookAvailableList, address){
		let result = `<h3>Книги по адресу ${address}</h3>`;
		bookAvailableList.map((bookAvailable) => {
			const bookLink = `<p><a class="bookLink" href='#${bookAvailable.id}'>${bookAvailable.book.author.first_name} ${bookAvailable.book.author.last_name} - ${bookAvailable.book.title}</a></br></p>`
			result = result.concat(bookLink);
		})
		return result
	}

	componentWillUnmount() {
		window.removeEventListener('hashchange', this.handleScroll);
	}

	handleScroll(event) {
		const targetBook = parseInt(window.location.hash.replace('#', ''));
		if (Number.isInteger(targetBook)) {
			this.setState({targetBook});
		}
	}

	updateInputValue = (event) => {
		const data = event.target.value;
		this.setState({searchString: data},
			() => {
				this.getBooksByString()
			});
	}

	getBooksByString = () => {
		this.updateBookList(this.state.searchString);
	}

	validateClickOnBookAvailable(bookAvailable) {
		if (this.props.user.is_anonymous){
			this.setState({showLogin: true});
		} else if (bookAvailable.user.id === this.props.user.id) {
			this.setState({
				showRemoveBook: true,
				bookRemoving: bookAvailable
			});
		} else {
			this.setState({
				showCreateOrder: true,
				bookOrdering: bookAvailable
			});
		}
	}

	render() {
		return <>
			<div className={"main"}>
				<div className={"landing"}>
					<h1 className={"mainHeader"}>
						Обменивайся книгами без границ!
					</h1>
					<div className={"articles"}>
						<div className={"article"}>
							<h1>
								Регистрируйся в пару кликов
							</h1>
							<p>
								Для регистрации достаточно войти на сайт
								через Telegram и оставить свое имя, чтобы другие
								пользователи знали, как к тебе обращаться. Чтобы упростить
								взаимодействие можно также разместить аватарку.
							</p>
						</div>
						<div className={"article"}>
							<h1>
								Ищи на интерактивной карте
							</h1>
							<p>
								Воспользуйся картой с поиском и фильтрам,
								чтобы найти интересующую тебя книгу и место,
								где ты можешь ее получить.
							</p>
						</div>
						<div className={"article"}>
							<h1>
								Делись книгами
							</h1>
							<p>
								Чтобы выложить книги на сайте достаточно загрузить
								фотографию домашней полки с книгами - сервис сам считает
								с нее все книги, останется только оставить те, которыми
								ты хочешь поделиться.
							</p>
						</div>
						<div className={"article"}>
							<h1>
								Получи книгу!
							</h1>
							<p>
								Воспользуйся чатом внутри сервиса
								или ботом в мессенджере, чтобы сконтактировать
								с владельцем книги и договориться о ее передаче.
								После успешного получения обязательно
								подтверди передачу!
							</p>
						</div>
					</div>
					<a href={"https://t.me/DanUZh1k"} className={"contactButton"}>
						{this.svgs.telegram}
						По всем вопросам пиши в Telegram!
					</a>
				</div>
				<div className={"searchWithMapContainer"}>
					<div className={"innerContainerMap"}>
						<h1>Книги для обмена в Москве</h1>
						<div className={"filters"}>
							<input type={'text'} className={'bookSearch'} placeholder={'Искать по названию или автору'}
								   onChange={evt => this.updateInputValue(evt)}
								   value={this.state.searchString}/>
							<button className={"searchByStringButton"} onClick={this.getBooksByString}>
								{this.svgs.search}
							</button>
						</div>
						<div className={"listAndMap"}>
							<div>
								<div className={'bookList'} ref={this.props.searchRef}>
									{this.state.booksAvailable &&
										this.state.booksAvailable.map((book, index) => {
											const address = book.user.address.name.split(', ').at(-1);
											return <div className={'bookContainer'} id={book.id}
														style={(book.id === this.state.targetBook) ? {color: "#27AE60"} : {}}
														onClick={() => {
															this.validateClickOnBookAvailable(book)
														}}>
												<h3>
													{book.book.author.first_name} {book.book.author.last_name} - {book.book.title}
												</h3>
												<p>
													{book.user.first_name}, {address}
												</p>
												{(index !== this.state.booksAvailable.length - 1) &&
													<hr/>}
											</div>
										})}
								</div>
							</div>
							<div>
								<YMaps>
									<div className={"mapContainer"}>
										<Map className={"mapClass"}
											 defaultState={{center: [55.75250, 37.623150], zoom: 13}}
											 modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}>
											{(Object.keys(this.state.placemarks).length !== 0) &&
												Object.keys(this.state.placemarks).map(key => {
													return <Placemark geometry={this.state.locationToCoords[key]}
																	  options={{preset: 'islands#circleIcon'}}
																	  properties={{
																		  iconContent: this.state.placemarks[key].length,
																		  balloonContent: this.renderListOfBooksInBalloon(this.state.placemarks[key], key),
																	  }}/>
												})
											}
										</Map>
									</div>
								</YMaps>
							</div>
						</div>
					</div>
				</div>
				{this.state.showLogin && <LoginPopup close={() => {this.setState({showLogin: false})}}
													 updateUser={this.props.updateUser}
													 user={this.props.user}/>}
				{this.state.showRemoveBook && <RemoveBookPopup close={() => {
					this.setState({showRemoveBook: false});
					this.updateBookList();
				}}
															   updateUser={this.props.updateUser}
															   book={this.state.bookRemoving}
															   user={this.props.user}/>}
				{this.state.showCreateOrder && <CreateOrderPopup close={() => {
					this.setState({showCreateOrder: false})
				}}
																 user={this.props.user}
																 bookOrdering={this.state.bookOrdering}/>}
			</div>
		</>
    }
}

export default React.forwardRef((props, ref) => <MainPage
  searchRef={ref} {...props}
/>);