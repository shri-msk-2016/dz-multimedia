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

        // let imageData = ctx.getImageData(0, 0, w, h)
        // let pixels = imageData.data
        //
        // for (let i = 0, n = pixels.length; i < n; i += 4) {
        //     let grayscale = pixels[i] * .3 + pixels[i + 1] * .59 + pixels[i + 2] * .11
        //     pixels[i] = grayscale;   // red
        //     pixels[i+1] = grayscale;   // green
        //     pixels[i+2] = grayscale;   // blue
        // }
        //
        // imageData.data = pixels
        // ctx.putImageData(imageData, 0, 0)
        // return canvas
    }

    let grayscaleGL = () => { // eslint-disable-line
        const vertexShaderCode = `attribute vec2 coordinates;
            attribute vec2 texture_coordinates;
            varying vec2 v_texcoord;
            void main() {
                gl_Position = vec4(coordinates,0.0, 1.0);
                v_texcoord = texture_coordinates;
            };`

        const fragShaderCode = `precision mediump float;
            varying vec2 v_texcoord;
            uniform sampler2D u_texture;
            uniform float u_time;
            void main() {
                gl_FragColor = texture2D(u_texture, v_texcoord) * .8 + texture2D(u_texture, v_texcoord) * rand(v_texcoord * u_time) * .2;
            };`
        let glCanvas = document.createElement('canvas')
        let gl = glCanvas.getContext('experimental-webgl')
        if (gl) {
            let vertexShader = gl.createShader(gl.VERTEX_SHADER)
            gl.shaderSource(vertexShader, vertexShaderCode)
            gl.compileShader(vertexShader)

            let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
            gl.shaderSource(fragmentShader, fragShaderCode)
            gl.compileShader(fragmentShader)

            let program = gl.createProgram()

            gl.attachShader(program, vertexShader)
            gl.attachShader(program, fragmentShader)
            gl.linkProgram(program)
            gl.useProgram(program)

            let buffer = gl.createBuffer()
            let vertices = [
                /* x, y */
                -1, -1,
                1, -1, -1, 1, -1, 1,
                1, -1,
                1, 1
            ]

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(
                gl.ARRAY_BUFFER, new Float32Array(vertices),
                gl.STATIC_DRAW
            );
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

            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;

            gl.texImage2D(
                gl.TEXTURE_2D,
                0, gl.RGBA, gl.RGBA,
                gl.UNSIGNED_BYTE,
                glCanvas // <-- вся магия здесь!
            )

            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLES, 0, 6)

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

    // let canvas = document.querySelector('#player');
    let getPlayer = function(config) {
        return Promise.all([
                loaders.subtitles(config.srtLink),
                loaders.video(config.videoLink),
                loaders.audio(config.audioLink),
                loaders.sfx('/old.mp4')
            ])
            .then(res => {
                let player = Player.instance('#player', {
                    subtitle: new SubtitleShowControl(res[0]),
                    video: res[1],
                    audio: res[2]
                });
                document.querySelector('.player__video-duration-changer').max = player.duration
                window.test = player._subtitle
                return [player, res[3]]
            })
    }

    let appInit = function(e) {
        e.preventDefault()
        if (Player._instance) {
            return
        }
        getPlayer(e.target.raw_serialize()).then(res => {
            let player = res[0]
            let sfx = res[1]
                // grayscaleGL()
            player.effects = [grayscaleJS, oldFilm(sfx)]
                // player.effects = [grayscaleGL(), grayscaleJS, oldFilm(sfx)]
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
                audio.crossOrigin = "anonymous";
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

                    // brown noize
                    // var brownNoise = (function() {
                    //     var lastOut = 0.0;
                    //     var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
                    //     node.onaudioprocess = function(e) {
                    //         var output = e.outputBuffer.getChannelData(0);
                    //         for (var i = 0; i < bufferSize; i++) {
                    //             var white = Math.random() * 2 - 1;
                    //             output[i] = (lastOut + (0.02 * white)) / 1.02;
                    //             lastOut = output[i];
                    //             output[i] *= 3.5;
                    //         }
                    //     }
                    //     return node;
                    // })();

                    // white noize
                    let whiteNoize = audioContext.createBufferSource()
                    let buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
                    let data = buffer.getChannelData(0);

                    for (var i = 0; i < bufferSize; i++) {
                        data[i] = Math.random()
                    }
                    whiteNoize.buffer = buffer
                    whiteNoize.loop = true

                    whiteNoize.connect(gainNode)

                    gainNode.connect(audioContext.destination)
                    // console.dir(whiteNoize)
                    audio.addEventListener('pause', () => {
                        whiteNoize.stop()
                        whiteNoize.disconnect()
                    })
                    audio.addEventListener('play', () => {
                        whiteNoize.connect(gainNode)
                        whiteNoize.start(0)
                    })
                    resolve(audio)
                })
            })
        },
        sfx: (link) => {
            return new Promise(resolve => {
                let video = document.createElement('video')
                video.src = link
                video.addEventListener('ended', () => {
                    video.play()
                }, false)
                video.play()
                resolve(video)
            })
        }
    }
}());
