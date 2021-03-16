Array.prototype.shuffle = function(){
    for (let i = this.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
}

const tokenize = function(word){
    return [...word.matchAll(/(ka|ga|ki|gi|ku|gu|ke|ge|ko|go|sa|za|shi|ji|su|zu|se|ze|so|zo|ta|da|chi|ji|tsu|zu|te|de|to|do|na|ni|nu|ne|no|ha|ba|pa|hi|bi|pi|fu|bu|pu|he|be|pe|ho|bo|po|ma|mi|mu|me|mo|ya|yu|yo|ra|ri|ru|re|ro|wa|wo|a|i|u|e|o|n)/g)].map(arr=>arr[0])
}

const displayWord = function(word, i){
    $("#word").empty()
    word.forEach((part, idx) => {
        let html = i == idx ? "u" : "span"
        let elt = $(`<${html}>${part}</${html}>`);
        $("#word").append(elt)
    })
}

const add = function(){
    $("#suggestions").empty()
    paper.clear()

    i += 1
    displayWord(word, i)

    myguess += this.innerText
    $("#myguess").text(myguess)
    $("#del").show()
    
    fetch(`/toRomaji?text=${this.innerText}`)
    .then(rep => rep.text())
    .then(romaji => {
        romajiguess += romaji
        if (i == word.length) check(word, myguess, romajiguess);
    })
}

const del = function(){
    myguess = myguess.slice(0, -1)
    romajiguess = tokenize(romajiguess).slice(0, -1).join("")
    $("#myguess").text(myguess)

    i -= 1
    displayWord(word, i)

    if (myguess.length == 0){
        $("#del").hide()
    }
}

const check = function(base, guess, romaji){
    $("#myguess").empty()
    $("#del").hide()

    romaji = tokenize(romaji);
    // Async loop through an array:
    (function c(i){
        if (i < guess.length){
            if (base[i] == romaji[i]){
                grade += 1
                $("#myguess").append($(`<span class="right" data-toggle="tooltip" title="${base[i]}">${guess[i]}</span>`))
                c(i+1)
            } else {
                fetch(`/to${mode}?char=${base[i]}`)
                .then(rep => rep.text())
                .then(correction => {
                    $("#myguess").append($(`<span class="wrong" data-toggle="tooltip" title="${romaji[i]}">${guess[i]}</span>`))
                    $("#myguess").append($(`<span class="corr" data-toggle="tooltip" title="${base[i]}">${correction}</span>`))
                    c(i+1)
                })
            }
        } else {
            $('[data-toggle="tooltip"]').tooltip()
            $("#next").show()
        }
    })(0)
}

const drawingRecognized = function(guesses){
    $("#suggestions").empty()
        
    if ("error" in guesses){
        $("#suggestions").append($(`<span class="text-danger">${guesses["error"]}</span>`))
    } else {
        for (let guess of guesses){
            const elt = $(`<a href="javascript:void(0)">${guess.character}</a>`)
            elt.on("click", add)
            $("#suggestions").append(elt)
        }
    }
}

const cvs = $("#drawing")[0]
const paper = new Paper(cvs)
paper.on("recognized", drawingRecognized)
paper.clear()

let words = ["kawaii", "sugoi"]
words.shuffle()
words = words.slice(0, 5)
let mode = "Hiragana"
let myguess = ""
let romajiguess = ""
let i = 0
let wi = 0
let word = tokenize(words[wi])
let grade = 0
let total = word.length

displayWord(word, i)

$("#clear").on("click", () => {
    paper.clear()
    $("#suggestions").empty()
})

$("#next").on("click", () => {
    myguess = ""
    romajiguess = ""

    if (wi < words.length - 1){
        word = tokenize(words[wi += 1])
        i = 0
        displayWord(word, i)
        total += word.length

        $("#myguess").empty()
        $("#next").hide()
    } else {
        $("#app").empty()
        ct = $('<div class="m-5 p-3 rounded"></div>')
        let score = Math.round(grade * 20 / total) / 2
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

$("#del").on("click", del)
$("#del").hide()