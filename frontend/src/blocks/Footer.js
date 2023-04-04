import React, {Component} from 'react';
import "../styles/blocks/footer.sass";
import SVGs from "../methods/SVGs";


class Footer extends Component {
    constructor() {
        super();
        this.state = {}
        this.svgs = new SVGs();
    }
    render() {
        return <>
            <div className={"footer"}>
                <a href={"https://t.me/DanUZh1k"}>
                    {this.svgs.telegram}
                    <h1>
                        Telegram
                    </h1>
                </a>
                <div className={"right"}>
                    <p>
                        Создано не в коммерческих целях
                    </p>
                </div>
            </div>
        </>
    }
}

export  default  Footer;