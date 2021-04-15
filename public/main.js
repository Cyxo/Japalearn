Array.prototype.shuffle = function(){
    for (let i = this.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
}

const tokenize = function(word){
    return [...word.matchAll(/(ka|ga|ki|gi|ku|gu|ke|ge|ko|go|sa|za|shi|ji|su|zu|se|ze|so|zo|ta|da|chi|ji|tsu|zu|te|de|to|do|na|ni|nu|ne|no|ha|ba|pa|hi|bi|pi|fu|bu|pu|he|be|pe|ho|bo|po|ma|mi|mu|me|mo|ya|yu|yo|ra|ri|ru|re|ro|wa|wo|a|i|u|e|o|n)/g)].map(arr=>arr[0])
}


class WordsDojo {

    displayWord(){
        $("#word").empty()
        this.word.forEach((part, idx) => {
            let html = this.i == idx ? "u" : "span"
            let elt = $(`<${html}>${part}</${html}>`);
            $("#word").append(elt)
        })
    }

    check(){
        $("#myguess").empty()
        $("#del").hide()

        this.romajiguess = tokenize(this.romajiguess);
        // Async loop through an array:
        let c
        (c = (i) => {
            if (i < this.myguess.length){
                if (this.word[i] == this.romajiguess[i]){
                    this.grade += 1
                    $("#myguess").append($(`<span class="right" data-toggle="tooltip" title="${this.word[i]}">${this.myguess[i]}</span>`))
                    c(i+1)
                } else {
                    fetch(`/to${this.mode}?char=${this.word[i]}`)
                    .then(rep => rep.text())
                    .then(correction => {
                        $("#myguess").append($(`<span class="wrong" data-toggle="tooltip" title="${this.romajiguess[i]}">${this.myguess[i]}</span>`))
                        $("#myguess").append($(`<span class="corr" data-toggle="tooltip" title="${this.word[i]}">${correction}</span>`))
                        c(i+1)
                    })
                }
            } else {
                $('[data-toggle="tooltip"]').tooltip()
                $("#next").show()
            }
        })(0)
    }

    drawingRecognized = (guesses) => {
        $("#suggestions").empty()
            
        if ("error" in guesses){
            $("#suggestions").append($(`<span class="text-danger">${guesses["error"]}</span>`))
        } else {
            for (let guess of guesses){
                const elt = $(`<a href="javascript:void(0)">${guess.character}</a>`)
                elt.on("click", (e) => {
                    $("#suggestions").empty()
                    this.paper.clear()
            
                    this.i += 1
                    this.displayWord()
            
                    this.myguess += e.target.innerText
                    $("#myguess").text(this.myguess)
                    $("#del").show()
                    
                    fetch(`/toRomaji?text=${e.target.innerText}`)
                    .then(rep => rep.text())
                    .then(romaji => {
                        this.romajiguess += romaji
                        if (this.i == this.word.length) this.check()
                    })
                })
                $("#suggestions").append(elt)
            }
        }
    }

    constructor(){
        this.cvs = $("#drawing")[0]
        this.paper = new Paper(this.cvs)
        this.paper.on("recognized", this.drawingRecognized)
        this.paper.clear()

        this.words = ["kawaii", "sugoi"]
        this.words.shuffle()
        this.words = this.words.slice(0, 5)
        this.mode = "Hiragana"
        this.myguess = ""
        this.romajiguess = ""
        this.i = 0
        this.wi = 0
        this.word = tokenize(this.words[this.wi])
        this.grade = 0
        this.total = this.word.length

        this.displayWord()

        $("#clear").on("click", () => {
            this.paper.clear()
            $("#suggestions").empty()
        })

        $("#next").on("click", () => {
            this.myguess = ""
            this.romajiguess = ""

            if (this.wi < this.words.length - 1){
                this.word = tokenize(this.words[this.wi += 1])
                this.i = 0
                this.displayWord()
                this.total += this.word.length

                $("#myguess").empty()
                $("#next").hide()
            } else {
                $("#app").empty()
                let ct = $('<div class="m-5 p-3 rounded"></div>')
                let score = Math.round(this.grade * 20 / this.total) / 2
                ct.text(`You have finished this exercize. Your score is ${score}/10.`)
                if (score > 6){
                    ct.addClass("bg-success text-light")
                    ct.append(" Congratulations!")
                } else if (score > 3) {
                    ct.addClass("bg-warning text-dark")
                    ct.append(" Continue training to improve your score!")
                } else {
                    ct.addClass("bg-danger text-light")
                    ct.append(` You should go back to learning ${mode}!`)
                }
                $("#app").append(ct)
            }
        })
        $("#next").hide()

        $("#del").on("click", () => {
            this.myguess = this.myguess.slice(0, -1)
            this.romajiguess = tokenize(this.romajiguess).slice(0, -1).join("")
            $("#myguess").text(this.myguess)
    
            this.i -= 1
            this.displayWord()
    
            if (this.myguess.length == 0){
                $("#del").hide()
            }
        })
        $("#del").hide()
    }
}

new WordsDojo()