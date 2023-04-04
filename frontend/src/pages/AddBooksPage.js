import React, {Component} from 'react';
import "../styles/pages/add.sass";
import SVGs from "../methods/SVGs";
import axios from "axios";
import {getCookie} from "../methods/Functions";
import {withGeolocator, withRouter} from "../methods/WithRouter";


class AddBooksPage extends Component {
    constructor(props) {
		super(props);
		this.state  = {
			progressData: {
				percent: 0,
				stage: 'Изображение отправляется на сервер...',
			},
			// result: [
			// 	{title: "Левша", id: 259, author: {first_name: "Николай", last_name: "Лесков"}, added: true},
			// 	{title: "В круге первом", id: 264, author: {first_name: "Александр", last_name: "Солженицын"}, added: true}
			// ],
			// image_url: '/bookshelf.jpg',
			searchString: ''
		};
		this.svgs = new SVGs();
	}

	validateFile = (file) => {
		const formData = new FormData();
		formData.append("image", file);
		axios.post('/upload_bookshelf',
			formData,
			{
				headers: {
					"X-CSRFToken": getCookie('csrftoken'),
					"Content-Type": "multipart/form-data"
				}
			})
			.then(json => {
				if (json.data.success) {
					this.setState(
						{progressData: json.data.progress_data},
						() => this.updateProgressBarCountdown = setInterval(() => this.updateProgressBar(), 3000)
						);
				} else {
					this.setState({error_message: json.data.message});
				}
			})
	}

	handleFileSelect = (event) => {
		const image = event.target.files[0];
		this.setState({
			image: image,
			image_url: URL.createObjectURL(event.target.files[0])
		});
		this.validateFile(image);
	}

	updateProgressBar = () => {
		axios.post('/get_progress',
			{pb_id: this.state.progressData.id},
			{
				headers: {
					"X-CSRFToken": getCookie('csrftoken')
				}
			})
			.then(json => {
				if (json.data.success) {
					this.setState({progressData: json.data.progress_data});
					if (json.data.progress_data.percent === 100){
						clearInterval(this.updateProgressBarCountdown);
						let result = json.data.progress_data.result;
						result.map((el)=>{el.added=true})
						this.setState({result: result})
					}
				} else {
					this.setState({error_message: json.data.message});
				}
			})
	}

	updateBooksAvailable = () => {
		axios.post('/update_books',
			{
				pb_id: this.state.progressData.id,
				result: this.state.result,
				latitude: this.props.geolocator.coords.latitude,
				longitude: this.props.geolocator.coords.longitude,
			},
			{
				headers: {
					"X-CSRFToken": getCookie('csrftoken')
				}
			}).then(json => {
			if (json.data.success) {
				this.props.navigator(`/user/${this.props.user.id}`);
			} else {
				this.setState({error_message: json.data.message});
			}
		})
	}

	componentWillUnmount = () => {
        if(this.updateProgressBarCountdown) {
			clearInterval(this.updateProgressBarCountdown);
		}
    }

	handleBookSelect = (i, added) =>{
		let tmp_result = this.state.result;
		tmp_result[i].added = !added;
		this.setState({result: tmp_result})
	}

	getBooksByString = () => {
		axios.get('/get_books_by_string', {params: {string: this.state.searchString}})
			.then(json => {
				if (json.data.success){
					this.setState({
						searchBookList: json.data.books,
					})
				} else {
					this.setState({error_message: json.data.message});
				}
			})
	}

	updateInputValue = (event) => {
		const data = event.target.value;
		this.setState({searchString: data},
			() => {
				if (data.length > 2) {
					this.getBooksByString();
				}
			});
	}

	addBookToList = (book) => {
		book.added = true;
		let result = this.state.result;
		result.push(book);
		this.setState({
			result: result,
			searchString: '',
			searchBookList: [],
		})
	}

    render() {
		return <>
			<div className={"container"}>
				<div className={"innerContainer"}>
					{(this.state.result) ?
						<>
							<h1 className={'secondHeader'}>
								Выбери книги, чтобы ими поделиться
							</h1>
							<div className={'bookAccept'}>
								<div className={'searchContainer'}>
									<div className={'bookList'}>
										{this.state.result.map((book, index) => {
											return <div className={'bookContainer'}>
												<div className={'innerBookContainer'}
													 onClick={() => {
														 this.handleBookSelect(index, book.added)
													 }}>
													<div className={'titleContainer'}>
														<h2>
															{book.title}
														</h2>
														<p>
															{book.author.first_name} {book.author.last_name}
														</p>
													</div>
													<div className={'checkboxContainer'}>
														{book.added ? this.svgs.checkboOn : this.svgs.checkboxOff}
													</div>
												</div>
												{(index !== this.state.result.length - 1) &&
													<hr/>}
											</div>
										})}
									</div>
									<div className={'searchBook'}>
										{(this.state.searchBookList && this.state.searchBookList.length !== 0 && this.state.searchString) &&
										<div className={'bookListPopup'}>
											{this.state.searchBookList.map((book, index) => {
												return <div className={'bookContainer'}>
													<div className={'innerBookContainer'}
														 onClick={() => {this.addBookToList(book)}}>
														<div className={'titleContainer'}>
															<h3>
																{book.title}
															</h3>
															<p>
																{book.author.first_name} {book.author.last_name}
															</p>
														</div>
													</div>
													{(index !== this.state.searchBookList.length - 1) &&
														<hr/>}
												</div>
											})}
										</div>}
										<input type={'text'} placeholder={'Искать'}
											   onChange={evt => this.updateInputValue(evt)}
											   value={this.state.searchString}/>
										<button onClick={this.getBooksByString}>
											{this.svgs.search}
										</button>
									</div>
									<button className={'submitBooks'} onClick={this.updateBooksAvailable}>
										<h2>
											Добавить книги
										</h2>
									</button>
								</div>
								<div className={'imagePreload'}
									 style={{backgroundImage: `url("${this.state.image_url}")`}}/>
							</div>
						</> :
						<>
							<h1>
								Поделись книгами
							</h1>
							<div className={"leftColumn"}>
								<h2>
									Разреши геолокацию - сервис сохранит<br/>ИСКЛЮЧИТЕЛЬНО твою станцию метро
								</h2>
								<div className={"arrow1"}>
									{this.svgs.arrow1}
								</div>
							</div>
							<div className={"rightColumn"}>
								<h2>
									Загрузи фотографию <br/>домашней полки с книгами<br/>
									и подожди пока алгоритм <br/>найдет на ней все книги
								</h2>
								{this.svgs.arrow2}
							</div>
							<div className={"leftColumn"}>
								<h2>
									Выбери конкретные книги, <br/>которыми будешь готов поделиться
								</h2>
								<div className={"arrow3"}>
									{this.svgs.arrow3}
								</div>
							</div>
							<div className={"rightColumn"}>
								<h2>
									Если алгоритм не определил <br/>какие-то книги, найди их сам в поиске
								</h2>
							</div>
							{!this.state.image_url ?
								<div className={"buttonContainer"}>
									<label className={"fileUpload"}>
										<input type={"file"} accept={".png,.jpg,.jpeg"}
											   onChange={this.handleFileSelect}/>
										<h1>Загрузить фотографию</h1>
									</label>
								</div> :
								<div className={'progressBarContainer'}>
									<h3>Обработка изображения</h3>
									<div className={'progressBarOuter'}>
										<div className={'progressBarInner'}
											 style={{width: `${this.state.progressData.percent}%`}}>
											<h4>
												{this.state.progressData.percent ?
													`${this.state.progressData.percent}%` : ''}
											</h4>
										</div>
									</div>
									<p>{this.state.progressData.stage}</p>
								</div>
							}
						</>
					}
				</div>
			</div>
		</>
    }
}

export  default  withGeolocator(withRouter(AddBooksPage));