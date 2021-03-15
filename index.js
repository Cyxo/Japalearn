const express   = require("express"),
      bdyParser = require("body-parser").json(),
      tf        = require('@tensorflow/tfjs-node'),
      Jimp      = require("Jimp"),
      alphabets = require("./alphabets.json"),
      jp        = require("jsonpath"),
      AWS       = require('aws-sdk');

require("dotenv").config()
const PORT = process.env.PORT

const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-1'
});

const app = express()
app.use(bdyParser)
app.use(express.static('public'))

app.post("/recognize", (req, res) => {
    let model
    switch (req.body.type){
        case "Hiragana":
            model = hiragana_model
            break
        case "Katakana":
            model = katakana_model
            break
        default:
            model = hiragana_model
    }

    Jimp.read(Buffer.from(req.body.drawing.replace(/^data:image\/png;base64,/, ""), 'base64'))
    .then(image => {
        const NUM_OF_CHANNELS = 1
        const WIDTH = 48, HEIGHT = 48

        image.invert()
        image.cover(WIDTH, HEIGHT, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)

        let values = new Float32Array(WIDTH * HEIGHT * NUM_OF_CHANNELS)

        let i = 0;
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const pixel = Jimp.intToRGBA(image.getPixelColor(x, y))
            pixel.r = pixel.r / 255.0
            values[i * NUM_OF_CHANNELS] = pixel.r
            i++
        })

        const outShape = [1, WIDTH, HEIGHT, NUM_OF_CHANNELS]
        const img_tensor = tf.tensor4d(values, outShape, 'float32')

        const predictions = model.then(res => res.predict(img_tensor).dataSync())
        predictions.then(pred => {
            let matches = [...pred.entries()].filter(arr => arr[1] > 0.1)
            if (matches.length > 0){
                try{
                    matches = matches.map(arr => ({
                        "character": jp.query(alphabets, `$.*.*[?(@.Romaji=="${hiragana_label[arr[0]]}")]`)[0][req.body.type],
                        "romaji": arr[0],
                        "accuracy": arr[1]
                    }))
                    res.json(matches.sort((a, b) => b.accuracy - a.accuracy).slice(0, 3))
                } catch (e) {
                    res.json({"error": `not recognized`})
                }
            } else {
                res.json({"error": `not recognized`})
            }
        })
    })
})

app.get("/toRomaji", (req, res) => {
    let romaji = ""

    for (char of req.query.text){
        try {
            romaji += jp.query(alphabets, `$.*.*[?(@.Hiragana=="${char}" | @.Katakana=="${char}")].Romaji`)
        } catch (e) {
            // its a kanji
        }
    }

    res.send(romaji)
})

app.get("/toHiragana", (req, res) => {
    const hira = jp.query(alphabets, `$.*.*[?(@.Romaji=="${req.query.char}")].Hiragana`)[0]
    res.send(hira)
})

app.get("/speak", (req, res) => {
    const params = {
        "Engine": "standard",
        "LanguageCode": "ja-JP",
        "VoiceId": "Mizuki",
        "OutputFormat": "mp3",
        "Text": req.query.text
    }

    Polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            console.log(err.code)
        } else if (data) {
            if (data.AudioStream instanceof Buffer) {
                res.type("audio/mpeg")
                res.end(data.AudioStream)
            }
        }
    })
})

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
})

const hiragana_model = tf.loadLayersModel(`file://models/hiragana/model.json`).then(mod => mod)
const katakana_model = tf.loadLayersModel(`file://models/katakana/model.json`).then(mod => mod)
const hiragana_label = require("./models/hiragana/labels.json")