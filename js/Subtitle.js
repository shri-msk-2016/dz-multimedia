class Subtitle {
    constructor(text) {
        this._subtitles = Subtitle.parse(text)
    }

    /**
     * @return {number} duration
     */
    get duration() {
        return this._subtitles.reduce((prevDuration, subtitle) => {
            return prevDuration + (subtitle.endTime - subtitle.startTime)
        }, 0)
    }

    /**
     * @param {string} text input text
     * @return {object} parsed subtitles
     */
    static parse(text) {
        text = text.replace(/\r/g, '')
        let regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g
        text = text.split(regex)
        text.shift()

        let items = []
        for (let i = 0; i < text.length; i += 4) {
            items.push({
                id: text[i].trim(),
                startTime: TimeHelper.timestampToMs(text[i + 1].trim()),
                endTime: TimeHelper.timestampToMs(text[i + 2].trim()),
                text: text[i + 3].trim()
            })
        }
        return items
    }
}

class SilentMovieSubtitle extends Subtitle { // eslint-disable-line
    constructor(text) {
        super(text)
        this._subtitles = SilentMovieSubtitle.toSilentMovie(this._subtitles)
    }

    static toSilentMovie(subtitles) {
        return subtitles.map(srt => {
            return Object.assign({}, srt, {
                startTime: srt.endTime,
                endTime: srt.endTime + (srt.endTime - srt.startTime)
            })
        })
    }
}

class SubtitleShowControl { // eslint-disable-line
    constructor(subtitles) {
        this._subtitles = subtitles
        this.subtitles = subtitles._subtitles
        let linkedList = new LinkedList()
        let offset = 0

        this.subtitles.forEach(srt => {
            linkedList.push({
                endTime: srt.endTime,
                startTime: offset + srt.startTime,
                offset
            })
            offset = offset + srt.endTime - srt.startTime
        })

        this.list = linkedList
    }

    get duration() {
        return this._subtitles.duration
    }

    /**
     * @param {number} time : time in ms
     * @param {HTMLCanvas} canvas : canvas
     * @returns {string} subtitles is show?
     */
    draw(time, canvas) {
        let currentSrt = this.subtitles.filter((srt) => {
            return time <= srt.endTime && time >= srt.startTime
        })[0]

        if (!currentSrt) { return false }

        this.drawText(
            canvas, 20, 20, canvas.width - 40, canvas.height - 40,
            currentSrt.text, 24, 2)

        return true
    }

    drawText(canvas, x, y, w, h, text, fh, spl) {
        const Paint = {
            RECTANGLE_STROKE_STYLE: 'white',
            RECTANGLE_LINE_WIDTH: 1,
            VALUE_FONT: '24px Oranienbaum',
            VALUE_FILL_STYLE: 'white'
        }

        /*
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} mw    : The max width of the text accepted
         * @param {string} font  : The font used to draw the text
         * @param {string} text  : The text to be splitted into
         */
        let _drawText = function(ctx, mw, font, text) {
            // add padding
            mw -= 10

            ctx2d.font = font

            let words = text.split(' ')
            let newLine = words[0]
            let lines = []
            for(let i = 1; i < words.length; ++i) {
               if (ctx.measureText(`${newLine} ${words[i]}`).width < mw) {
                   newLine += ` ${words[i]}`
               } else {
                   lines.push(newLine)
                   newLine = words[i]
               }
            }
            lines.push(newLine)
            return lines
        }

        let ctx2d = canvas.getContext('2d')
        if (ctx2d) {
            ctx2d.fillStyle = 'black'
            ctx2d.fillRect(0, 0, canvas.width, canvas.height)
            ctx2d.fillStyle = Paint.VALUE_FILL_STYLE

            // draw rectangular
            ctx2d.strokeStyle = Paint.RECTANGLE_STROKE_STYLE
            ctx2d.lineWidth = Paint.RECTANGLE_LINE_WIDTH
            ctx2d.strokeRect(x, y, w, h)

            // Paint text
            let lines = _drawText(ctx2d, w, Paint.VALUE_FONT, text)

            // Block of text height
            let both = lines.length * (fh + spl)
            if (both >= h) {
                // We won't be able to wrap the text inside the area
                // the area is too small. We should inform the user
                // about this in a meaningful way
            } else {
                // We determine the y of the first line
                let ly = (h - both) / 2 + y + spl * lines.length
                let lx = 0;
                for (let j = 0; j < lines.length; ++j, ly+=fh+spl) {
                    // We continue to centralize the lines
                    lx = x + w / 2 - ctx2d.measureText(lines[j]).width / 2
                    ctx2d.fillText(lines[j], lx, ly)
                }
            }
        }
    }
}
