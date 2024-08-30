const helper = function() {
    // ad-hoc
    // a22 = idx 4

    const matrixToFlatIdx = function(i, j) {
        return (j-1) + 3*(i-1);
    }
    const flatToMatrixIdx = function(idx) {
        return [ parseInt(idx / 3) + 1, (idx % 3) + 1];
    }
    return { matrixToFlatIdx, flatToMatrixIdx };
}();


const gameObject = function() {
    /** @typedef {Object} Player 
     * @property {Function} getName
     * @property {Function} getID
     * */

    /**
     * 
     * @param {String} name 
     * @param {Number} id 
     * @returns {Player}
     */
    const createPlayer = function(name, id) {
        const getName = () => name;
        const getID = () => id;
        return { getName, getID };
    }

    const gameBoard = function() {
        /** @type {(number|null)[][]} */
        const _matrix = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];

        const getBoardState = () => _matrix.map((line) => [...line])
        const setPosition = (i, j, id) => {
            if (i < 1 || j < 1) throw new RangeError("Use proper matrix notation");
            if (_matrix.length < i) throw new RangeError("Line index too large");
            if (_matrix[0].length < j) throw new RangeError("Column index too large");
            i--; 
            j--;
            _matrix[i][j] = id;
        }

        const reset = () => {
            for (let i = 0; i < _matrix.length; i++) {
                for (let j = 0; j < _matrix[i].length; j++) {
                    _matrix[i][j] = null;
                }
            }
        }

        return { getBoardState, setPosition, reset };
    }();

    let p1Name, p2Name;
    
    let player1, player2;

    const createPlayers = function(arr) {
        [p1Name, p2Name] = arr;
        player1 = createPlayer(p1Name, 0);
        player2 = createPlayer(p2Name, 1);
    }

    const getPlayers = () => [player1, player2];

    const playersDefined = () => !(typeof player1 !== "undefined" || typeof player2 !== "undefined")

    return { getPlayers, gameBoard, createPlayers, playersDefined};
}();


const gameController = function() {

    /** @type {Player[]} */
    const players = [];
    let activePlayer = null;
    let gameWinner = null;

    const startGame = function () {
        gameWinner = null;
        gameObject.gameBoard.reset();
        players.pop();
        players.pop();
        players.push(...gameObject.getPlayers());
        activePlayer = players[0].getID();
    };

    const gameCheck = function () {
        const winningPositions = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        const playerPositions = {};
        const nullPositions = [];
        const flatBoardState = gameObject.gameBoard.getBoardState().flat();

        players.forEach((playerObj) => {
            playerPositions[playerObj.getID()] = new Array();
        })

        flatBoardState.forEach( function(value, index) {
            if (value === null) {
                nullPositions.push(index);
            } else {
                for (let player in playerPositions) {
                    player = parseInt(player);
                    const arr = playerPositions[player];
                    if (value === player) arr.push(index);
                }
            }
        });

        let gameState = true;


        winningPositions.forEach( function(position) {
            if (!gameState) return;
            for (let playerID in playerPositions) {
                playerID = parseInt(playerID);
                /** @type {Number[]} */
                const arr = playerPositions[playerID];
                
                if (arr.length >= 3) {
                    let winCheck = true;
                    for (let idx of position) {
                        if (!winCheck) break;
                        if (!arr.includes(idx)) winCheck = false;
                        continue;
                    }
    
                    gameState = !winCheck;
                    if (winCheck)  {
                        gameWinner = players[playerID].getName();
                        break;   
                    }
                }
            
            }
        });

        if (nullPositions.length == 0) gameState = false;

        return gameState;

    }

    const playRound = function (i, j){
        let currentRound = gameObject.gameBoard.getBoardState().flat();
        let index = helper.matrixToFlatIdx(i, j);
        if (currentRound[index] !== null) return;
        gameObject.gameBoard.setPosition(i, j, activePlayer);
        activePlayer = ++activePlayer % players.length;
    }

    const debugDisplay = function() {
        const matrix = gameObject.gameBoard.getBoardState();
        console.log({ matrix, gameWinner});

    }

    const getWinner = () => gameWinner;

    const getActivePlayer = () => players[activePlayer].getName();

    const restartGame = () => {
        gameObject.gameBoard.reset();
        gameWinner = null;
        activePlayer = players[0].getID();

    }
    return {startGame, playRound, gameCheck, getWinner, getActivePlayer, restartGame};
}();

const DOMHandler = function() {

    const boardElem = document.querySelector("#board");
    const statusElem = document.querySelector("#status");
    const activeElem = document.querySelector("#container>h1");
    const dialogElem = document.querySelector("dialog");
    const formElem = document.querySelector("form");
    const closeBtn = document.querySelector("#close");
    const formBtn = document.querySelector("form>button");
    
    const newGameBtn = document.querySelector("#start");
    const resetBtn = document.querySelector("#reset");
    
    // identifier to display intention. IIFE but not a factory;
    const createDOMButtons = function () {  

        const flatBoardState = gameObject.gameBoard.getBoardState().flat();
        for (let idx in flatBoardState) {
            const buttonElement = document.createElement("button");
            buttonElement.dataset.boardIdx = idx;
            
            buttonElement.addEventListener("click", e => {
                if (!gameController.gameCheck()) return;
                let [i, j] = helper.flatToMatrixIdx(parseInt(buttonElement.dataset.boardIdx));
                console.log("Placing at ", {i, j});
                gameController.playRound(i, j);
                updateContent();
            });
            
            boardElem.appendChild(buttonElement);
        }
        
    }();
    
    const updateContent = function() {
        activeElem.textContent = `${gameController.getActivePlayer()}'s turn`;
        statusElem.textContent = "";

        const buttons = [...boardElem.children];
        const flatBoardState = gameObject.gameBoard.getBoardState().flat();
        for (let button of buttons) {
            const boardIdx = parseInt(button.dataset.boardIdx);
            const state = flatBoardState[boardIdx];
            if (state === null) {
                button.textContent = "";
                continue;
            } 
            else if (state === 0) button.textContent = "X";
            else if (state === 1) button.textContent = "O";
        }

        if (!gameController.gameCheck()) {
            activeElem.textContent = `Game is finished`;
            const winner = gameController.getWinner()
            if (winner === null) {
                statusElem.textContent = `It's a draw!`;
                return;
            }
            statusElem.textContent = `${winner} won the game!`;
        }
    }

    const closeDialog = () => dialogElem.close();
    const openDialog = () =>  {
        if(!dialogElem.open) dialogElem.showModal();
    }
    closeBtn.addEventListener("click", closeDialog);

    const promptPlayers = function() {
        const playerArray = [];
        openDialog();

        formBtn.removeEventListener()
        formBtn.addEventListener("click", e => {
            e.preventDefault();
            plr1Input = formElem.querySelector("#p1");
            plr2Input = formElem.querySelector("#p2");

            playerArray.push(plr1Input.value, plr2Input.value);
            plr1Input.value = "";
            plr2Input.value = "";
            closeDialog();
            gameObject.createPlayers(playerArray);
            gameController.startGame();
            updateContent();
        });
    }

    newGameBtn.addEventListener("click", e => promptPlayers());
    resetBtn.addEventListener("click", () => {
        gameController.restartGame();
        updateContent();
    })

    return {promptPlayers};
}();

DOMHandler.promptPlayers();