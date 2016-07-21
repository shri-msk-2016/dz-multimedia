const MIN_FRAME_RATE = 20
const MAX_FRAME_RATE = 30

class Player { // eslint-disable-line
    constructor(selector, options) {
        this.effects = []

        this._video = options.video
        this._video.volume = 0
        this._subtitle = options.subtitle
        this._audio = options.audio

        document.querySelector('.player__video-duration-changer').max = this.duration

        let DOMElement = document.querySelector(selector)
        this._canvas = DOMElement
        this._context = DOMElement.getContext('2d')

        this.currentSrt = null

        this._workCanvas = document.createElement('canvas')
        this.__timeoutId = false
        this.__tickId = false

        this.__timer = {}

        this.isNeedDownFPS = true
        this.currentTime = 0

        // this.paused = true

        // document.querySelector('.player__video-duration-changer').addEventListener('')
        // document.querySelector('.player__video-button').addEventListener('click', () => {
        //     if (this.paused) {
        //         console.log('play');
        //         this.play(this.currentTime)
        //     } else {
        //         this.pause()
        //     }
        // })
    }

    get played() { return Boolean(this.__timeoutId) }

    draw(timestamp, canvas, work, video, srt, effects) {
        let workCtx = work.getContext('2d')
        let srtFlag = srt.draw(timestamp, work)
        if (srtFlag) {
            video.pause()
        } else {
            video.play()
            workCtx.drawImage(video, 0, 0, work.width, work.height)
        }

        work = effects.reduce((canvas, effect) => effect(canvas), work)

        let ctx = canvas.getContext('2d')
        ctx.drawImage(work, 0, 0, canvas.width, canvas.height)
    }

    updateControls(timestamp, videotimestamp) {
        // sorry
        document.querySelector('.player__video-duration-changer').value = timestamp
        document.querySelector('#timestamp').textContent = timestamp
        document.querySelector('#videotimestamp').textContent = videotimestamp
    }

    tick() {
        let nextFrameAfter = randomBetween(MIN_FRAME_RATE, MAX_FRAME_RATE)
        let nextTimeout = this.isNeedDownFPS ? 1000/nextFrameAfter : 0
        let timestamp = this.currentTime
        let canvas = this._canvas
        let work = this._workCanvas
        work.width = canvas.width
        work.height = canvas.height
        let video = this._video
        let effects = this.effects
        let srt = this._subtitle

        if (video.ended) { this.pause(); return }
        this.__tickId = setTimeout(() => {
            requestAnimationFrame(() => {
                this.updateControls(timestamp, this.__videotimestamp)
                this.draw(timestamp, canvas, work, video, srt, effects)
                this.tick()
            })
        }, nextTimeout)
    }

    __tick() {
        this.__timeoutId = setTimeout(() => {
            let time = new Date().getTime() - this.__timer.start
            let elapsed = Math.floor(time / 100) / 10;
            if(Math.round(elapsed) === elapsed) { elapsed += '.0' }
            this.__timer.elapsed = elapsed
            this.currentTime = time
            this.__tick()
        }, 100)
    }

    play(time) {
        time = time || 0

        let video = this._video
        let audio = this._audio

        if (!this.paused) {
            this.pause()
        }
        if (time) {
            this.currentTime = time
            video.currentTime = TimeHelper.msToSec(this.__videotimestamp)
            audio.currentTime = TimeHelper.msToSec(time)
        }

        this.paused = true
        video.play()
        audio.play()
        let newTimer = {}
        // if (this.__timer) {
            // newTimer = Object.assign({}, this.__timer, {start: new Date().getTime()})
        // } else {
            newTimer = {
                start: new Date().getTime(),
                elapsed: TimeHelper.msToSec(time)
            }
        // }

        this.__timer = newTimer
        this.__tick()
        this.tick()
    }

    pause() {
        this.paused = false
        this._video.pause()
        this._audio.pause()

        clearTimeout(this.__timeoutId)
        clearTimeout(this.__tickId)
    }

    get duration() {
        return TimeHelper.secToMs(this._video.duration) + this._subtitle.duration
    }

    get __videotimestamp() {
        let timestamp = this.currentTime
        let srt = this._subtitle
        if (!this.currentSrt || timestamp > this.currentSrt.endTime) {
            this.currentSrt = srt.list.pop().value || {offset: 0}
        }

        let offset = this.currentSrt.offset
        return timestamp - offset
    }

    static instance(selector, options) {
        let instance = null
        if (this._instance) {
            instance = this._instance
        } else {
            instance = new Player(selector, options)
            this._instance = instance
        }
        return instance
    }
}
