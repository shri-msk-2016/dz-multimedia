// monkey patch
/* eslint-disable */
(function () {
    let serialize = function() {
        let that = this
        let i, j, q = {}
        for (i = that.elements.length - 1; i >= 0; i = i - 1) {
            if (that.elements[i].name === "") { continue }
            switch (that.elements[i].nodeName) {
                case 'INPUT':
                switch (that.elements[i].type) {
                    case 'text':
                    case 'hidden':
                    case 'password':
                    case 'button':
                    case 'reset':
                    case 'submit':
                        q[that.elements[i].name] =  that.elements[i].value
                    break;
                    case 'checkbox':
                    case 'radio':
                    if (that.elements[i].checked) {
                        q[that.elements[i].name] = that.elements[i].value
                    }
                    break;
                }
                break;
                case 'file':
                break;
                case 'TEXTAREA':
                    q[that.elements[i].name] = that.elements[i].value
                break;
                case 'SELECT':
                switch (that.elements[i].type) {
                    case 'select-one':
                        q[that.elements[i].name] = that.elements[i].value
                    break;
                    case 'select-multiple':
                    for (j = that.elements[i].options.length - 1; j >= 0; j = j - 1) {
                        if (that.elements[i].options[j].selected) {
                            q[that.elements[i].name] = that.elements[i].options[j].value
                        }
                    }
                    break;
                }
                break;
                case 'BUTTON':
                switch (that.elements[i].type) {
                    case 'reset':
                    case 'submit':
                    case 'button':
                        q[that.elements[i].name] = that.elements[i].value
                    break;
                }
                break;
            }
        }
        return q;
    }

    HTMLFormElement.prototype.raw_serialize = serialize
}())
/* eslint-enable */

class TimeHelper { // eslint-disable-line
    constructor() {
        throw new Error('Don\'t try this!')
    }

    static timestampToMs(val) {
        let regex = /(\d+):(\d{2}):(\d{2}),(\d{3})/
        let parts = regex.exec(val)

        if (parts === null) { return 0; }

        for (let i = 1; i < 5; i++) {
            parts[i] = parseInt(parts[i], 10)
            if (isNaN(parts[i])) {
                parts[i] = 0
            }
        }

        // hours + minutes + seconds + ms
        return parts[1] * 3600000 + parts[2] * 60000 + parts[3] * 1000 + parts[4]
    }

    static secToMs(time) {
        return Math.round(time * 1000)
    }

    static msToSec(time) {
        return (time / 1000)
    }
}

const randomBetween = (min, max) => { // eslint-disable-line
    Math.floor(Math.random() * (max - min + 1) + min)
}

class Node {
    constructor(value) {
        this.value = value
        this.next = {}
    }
}

class LinkedList { // eslint-disable-line
    constructor() {
        this.first = null
        this.last = null
    }

    push(value) {
        const node = new Node(value)
        if (this.first === null) {
           this.first = this.last = node
        } else {
           this.last.next = node
           this.last = node
        }
    }

    pop() {
       const value = this.first
       this.first = this.first.next
       return value
    }

    remove(index) {
        let i = 0
        let current = this.first
        let previous = null
        if(index === 0) {
            this.first = current.next
        } else {
            while(i++ < index) {
                previous = current
                current = current.next
            }
            // skip to the next node
            previous.next = current.next
        }
        return current.value
    }
}
