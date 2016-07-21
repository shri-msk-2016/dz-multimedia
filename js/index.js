(function() {
    let grayscaleJS = (canvas) => {
        let ctx = canvas.getContext('2d')

        let w = canvas.width
        let h = canvas.height

        ctx.fillStyle = '#ffffff'
        let defaultGlobalCompositeOperation = ctx.globalCompositeOperation
        ctx.globalCompositeOperation = 'color'
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = defaultGlobalCompositeOperation
        return canvas
    }

    let filmGrain = (canvas) => { //eslint-disable-line
        let ctx = canvas.getContext('2d')
        for (let i = 1e6; i--; ) {
            let x = i % 1e3
            let y = i / 1e3
            ctx.fillStyle =  `hsl(${~~Math.tan(x * y)}, 40%, 40%)` //eslint-disable-line
            ctx.fillRect(x, y, 1, 1)
        }
        return canvas
    }

    let grayscaleGL = () => { // eslint-disable-line
        const vertexShaderCode = `attribute vec2 coordinates;
            attribute vec2 texture_coordinates;
            varying vec2 v_texcoord;

            void main() {
                gl_Position = vec4(coordinates, 0.0, 1.0);
                v_texcoord = texture_coordinates;
            }`

        const fragShaderCode = `
            precision mediump float;
            varying vec2 v_texcoord;
            uniform sampler2D u_texture;
            void main() {
                // float a = 0.5;
                gl_FragColor = texture2D(u_texture, v_texcoord);
                gl_FragColor.rgb = vec3(dot(gl_FragColor.rgb, vec3(0.2989, 0.5870, 0.1140)));
            }`

        const vertices = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
        ])
        let glCanvas = document.createElement('canvas')
        glCanvas.width = 533
        glCanvas.height = 300
        let gl = glCanvas.getContext('webgl')

        const checkShaderCompiled = (shader) => {
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.log(`invalid shader : ${gl.getShaderInfoLog(shader)}`) // eslint-disable-line
            }
            return 0
        }

        if (gl) {
            let vertexShader = gl.createShader(gl.VERTEX_SHADER)
            gl.shaderSource(vertexShader, vertexShaderCode)
            gl.compileShader(vertexShader)
            checkShaderCompiled(vertexShader)

            let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
            gl.shaderSource(fragmentShader, fragShaderCode)
            gl.compileShader(fragmentShader)
            checkShaderCompiled(fragmentShader)

            let program = gl.createProgram()

            gl.attachShader(program, vertexShader)
            gl.attachShader(program, fragmentShader)

            gl.linkProgram(program)
            gl.validateProgram(program)

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                let info = gl.getProgramInfoLog(program)
                console.error(info) // eslint-disable-line
            }

            gl.useProgram(program)

            let buffer = gl.createBuffer()

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(
                gl.ARRAY_BUFFER, vertices,
                gl.STATIC_DRAW
            )
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

            let positionLocation = gl.getAttribLocation(program, 'coordinates')
            gl.enableVertexAttribArray(positionLocation)
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

            let texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
        }

        return (canvas) => {
            // fallback to JS implementation
            let ctx = canvas.getContext('2d')
            if (!gl) {
                return grayscaleJS(canvas)
            }

            gl.viewportWidth = canvas.width
            gl.viewportHeight = canvas.height
            glCanvas.width = canvas.width
            glCanvas.height = canvas.height
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, gl.RGBA, gl.RGBA,
                gl.UNSIGNED_BYTE,
                canvas // <-- вся магия здесь!
            )

            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2)

            ctx.drawImage(glCanvas, 0, 0, canvas.width, canvas.height)
            return canvas
        }
    }

    let oldFilm = (video) => {
        return (canvas) => {
            let ctx = canvas.getContext('2d')
            let oldOperation = ctx.globalCompositeOperation
            video.width = canvas.width
            video.height = canvas.height

            ctx.globalCompositeOperation = 'multiply'
            ctx.drawImage(video, 0, 0)
            ctx.globalCompositeOperation = oldOperation
            return canvas
        }
    }

    let getPlayer = function(config) {
        document.querySelector('.player').classList.add('player--loader')
        return Promise.all([
                loaders.subtitles(config.srtLink),
                loaders.video(config.videoLink),
                loaders.audio(config.audioLink),
                loaders.sfx('old.mp4')
            ])
            .then(res => {
                document.querySelector('.player').classList.remove('player--loader')
                let srt = res[0]
                let video = res[1]
                let audio = res[2]
                let sfx = res[3]

                video.addEventListener('ended', () => {
                    sfx.pause()
                })

                let player = Player.instance('#player', {
                    subtitle: new SubtitleShowControl(srt),
                    video,
                    audio
                })

                return [player, oldFilm(res[3])]
            })
    }

    let appInit = function(e) {
        e.preventDefault()
        if (Player._instance) { return }
        getPlayer(e.target.raw_serialize()).then(res => {
            let player = res[0]
            let oldFilmSfx = res[1]
            player.effects = [grayscaleJS, oldFilmSfx]
            // player.effects = [grayscaleGL(), oldFilmSfx]
            player.play()
        })
    }

    document.getElementById('linksForm').addEventListener('submit', appInit)

    let loaders = {
        subtitles: (link) => {
            return new Promise((resolve, reject) => {
                fetch(link, {
                    method: 'GET',
                    headers: {
                        "Content-Type": 'text/plain',
                        "Origin": "anonymous"
                    },
                    mode: 'no-cors',
                }).then(response => {
                    return response.text()
                }).then(text => {
                    resolve(new SilentMovieSubtitle(text))
                }).catch(e => {
                    reject(e)
                })
            })
        },
        video: (link) => {
            return new Promise((resolve, reject) => {
                let video = document.createElement('video')

                video.height = 300
                video.width = 533
                // video.crossOrigin = "anonymous"
                video.loop = false
                video.src = link

                video.addEventListener('loadeddata', () => {
                    resolve(video)
                })

                video.addEventListener('error', e => {
                    reject(e)
                })
            })
        },
        audio: (link) => {
            return new Promise((resolve) => {
                let audio = document.createElement('audio')
                audio.crossOrigin = "anonymous"
                const audioContext = new(window.AudioContext || window.webkitAudioContext)()
                audio.src = link
                audio.addEventListener('loadeddata', () => {
                    let source = audioContext.createMediaElementSource(audio)

                    // gain
                    let gainNode = audioContext.createGain()
                    setInterval(() => {
                        gainNode.gain.value = Math.random()
                    }, 100)
                    source.connect(gainNode)

                    let bufferSize = 512

                    let pinkNoise = (function() {
                        let node = audioContext.createScriptProcessor(bufferSize / 2, 1, 1)

                        node.onaudioprocess = function(e) {
                            for (let ch = 0; ch < e.outputBuffer.numberOfChannels; ch++) {
                                let inputData = e.inputBuffer.getChannelData(ch)
                                let outputData = e.outputBuffer.getChannelData(ch)

                                for (let i = 0; i < e.inputBuffer.length; i++) {
                                    let white = Math.random() * 2 - 1
                                    outputData[i] = inputData[i] + white * 0.01
                                }
                            }
                        }

                        return node
                    }())

                    gainNode.connect(audioContext.destination)
                    audio.addEventListener('pause', () => {
                        pinkNoise.disconnect()
                    })
                    audio.addEventListener('play', () => {
                        pinkNoise.connect(audioContext.destination)
                    })
                    resolve(audio)
                })
            })
        },
        sfx: (link) => {
            return new Promise(resolve => {
                let video = document.createElement('video')
                video.src = link
                video.addEventListener('loadeddata', () => {
                    video.play()
                    resolve(video)
                })
                video.addEventListener('ended', () => {
                    video.play()
                }, false)
            })
        }
    }
}())
