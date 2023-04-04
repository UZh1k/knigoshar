import React, {Component} from "react";
import {Routes, Route, BrowserRouter} from 'react-router-dom'
import MainBody from "./blocks/MainBody";
import MainPage from "./pages/MainPage";
import UserPage from "./pages/UserPage";
import AddBooksPage from "./pages/AddBooksPage";
import "@fontsource/karla";
import "@fontsource/merriweather";
import axios from "axios";
import {getCookie} from "./methods/Functions";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: {
                is_anonymous: true
            },
        }
        this.searchRef = React.createRef();
    }

    componentDidMount() {
        const csrftoken = getCookie('csrftoken');
        if (csrftoken && this.state.user.is_anonymous) {
            axios.post('/refresh_user',
                {},
                {headers: {"X-CSRFToken": csrftoken}})
                .then(json => {
                    if (json.data.success) {
                        this.updateUser(json.data.user_data);
                    } else {
                        this.setState({error_message: json.data.message});
                    }
                })
        }
    }

    updateUser = (user) => {
        this.setState({user: user})
    }

    render() {
        return <>
            <BrowserRouter>
                <Routes>
                    <Route path={'/'} element={<MainBody updateUser={this.updateUser}
                                                         user={this.state.user}
                                                         searchRef={this.searchRef}/>}>
                        <Route path="" element={<MainPage searchRef={this.searchRef}
                                                          updateUser={this.updateUser}
                                                          user={this.state.user}/>}/>
                        <Route path="user/:userId" element={<UserPage updateUser={this.updateUser}
                                                                      user={this.state.user}/>}/>
                        <Route path="add" element={<AddBooksPage updateUser={this.updateUser}
                                                                 user={this.state.user}/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    }
}

export default App;
