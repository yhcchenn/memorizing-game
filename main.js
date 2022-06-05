const GAME_STATE = {
    FirstCardAwaits: 'FirstCardAwaits',
    SeconCardAwaits: 'SeconCardAwaits',
    CardsMatchFailed: 'CardsMatchFailed',
    CardsMatched: 'CardsMatched',
    GameFinished: 'GameFinished',
}

const Symbols = [
  '&#9828', // spade
  '&#9831', // club
  '&#9825', // heart
  '&#9826' // diamond
  ]

const view = {
    // 牌卡元素
    getCardElement(index) {
        return `<div data-index="${index}" class="card back"></div>`
    },
    // 牌面的數字與花色
    getCardContent(index) {
        const number = this.transformNumber((index % 13) + 1)
        const symbol = Symbols[Math.floor(index / 13)]
        return `
        <p>${number}</p>
        <p class="symbol">${symbol}</p>
        <p>${number}</p>
        `
    },
    // 轉換A,J,Q,K
    transformNumber(number) {
        switch (number) {
            case 1:
                return 'A'
            case 11:
                return 'J'
            case 12:
                return 'Q'
            case 13:
                return 'K'
            default:
                return number
        }
    },
    // 顯示卡片
    displayCards(indexes) {
        const rootElement = document.querySelector('#cards')
        // 使用 map 迭代出陣列裡的內容，並以 join('') 把陣列合併成字串作為 HTML template 
        rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
    },
    // 翻牌，使用 ... 展開運算子 (spread operator)
    flipCards(...cards) {
        cards.map(card => {
            // 回傳牌面
            if (card.classList.contains('back')) {
                card.classList.remove('back')
                card.innerHTML = this.getCardContent(Number(card.dataset.index))
                return
            }
            // 回傳牌背
            card.classList.add('back')
            card.innerHTML = null
        })
    },
    // 配對成功的卡片
    pairedCards(...cards) {
        cards.map(card => {
            card.classList.add('paired')
        })
    },
    // 產生分數與計數
    renderScore(score) {
        document.querySelector('.score').textContent = `Score: ${score}`
    },
    renderTriedTimes(times) {
        document.querySelector('.tried').textContent = `You've tried: ${times} times`
    },
    // 配對錯誤時的動畫
    appendWrongAnimation (...cards) {
        cards.map(card => {
            card.classList.add('wrong')
            card.addEventListener('animationend', event => 
            event.target.classList.remove('wrong'), { once: true }) // {once: true} 要求事件執行一次之後，卸載這個監聽器
        })
    },
    showGameFinished() {
        const div = document.createElement('div')
        const header = document.querySelector('#header')
        div.classList.add('completed')
        div.innerHTML = `
        <p>CONGRATS!</p>
        <p>Your Score | ${model.score}</p>
        <p>You've tried | ${model.triedTimes} times</p>`
        header.before(div)
    }
}

const model = {
    // 暫存牌組 
    revealedCards: [],
    // 比對暫存牌組
    isRevealedCardsMatched() {
        return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
    },
    score: 0,
    triedTimes: 0
}

const controller = {
    currentState: GAME_STATE.FirstCardAwaits, // 初始狀態：還沒翻牌
    generateCards() {
        view.displayCards(utility.getRandomNumberArray(52))
    },
    dispatchCardAction(card) {
        if (!card.classList.contains('back')) {
            return
        }
        switch (this.currentState) {
            case GAME_STATE.FirstCardAwaits:
                view.flipCards(card)
                model.revealedCards.push(card)
                this.currentState = GAME_STATE.SeconCardAwaits
                break
            case GAME_STATE.SeconCardAwaits:
                view.renderTriedTimes(++model.triedTimes) 
                view.flipCards(card)
                model.revealedCards.push(card)
                // 確認是否配對
                if (model.isRevealedCardsMatched()) {
                    // 配對成功
                    view.renderScore(model.score += 10)
                    this.currentState = GAME_STATE.CardsMatched
                    view.pairedCards(...model.revealedCards)
                    model.revealedCards = []
                    // 配對完成
                    if (model.score === 260) {
                        console.log('showGameFinished')
                        this.currentState = GAME_STATE.GameFinished
                        view.showGameFinished()
                        return
                    }
                    this.currentState = GAME_STATE.FirstCardAwaits
                } else {
                    // 配對失敗
                    this.currentState = GAME_STATE.CardsMatchFailed
                    view.appendWrongAnimation(...model.revealedCards)
                    setTimeout(this.resetCards, 1000) // 注意：setTimeout第一個參數為函式本身，而非呼叫函式的結果
                }
                break
        }
        console.log('current state: ', this.currentState)
        console.log('revealed card', model.revealedCards.map(card => card.dataset.index))
    },
    resetCards() {
        view.flipCards(...model.revealedCards)
        model.revealedCards = []
        controller.currentState = GAME_STATE.FirstCardAwaits // 注意：由於此函式以做為參數被傳給 setTimeout，故此處的 this 會導向 setTimeout
    }
}

const utility = {
    // 洗牌：隨機重組陣列項目
    getRandomNumberArray(count) {
        const number = Array.from(Array(count).keys()) // 建立連續數字的陣列
        for (let index = number.length - 1; index > 0; index--) {
            let randomIndex = Math.floor(Math.random() * (index + 1))
                ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] // 解構賦值 
        }
        return number
    }
}

controller.generateCards()

// 監聽事件：卡片
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', event => {
        controller.dispatchCardAction(card)
    })
})
