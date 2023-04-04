import axios from 'axios';

export default class Api {
    constructor() {
        this.endpoint = '/api/v1'
    }

    get_all_books = () => {
        const body = new FormData()
        return fetch(`${this.endpoint}/books/`, {
            method: 'POST',
            body: body
        })
    }
}