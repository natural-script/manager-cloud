const firebase = require('firebase');
const config = {
    apiKey: "AIzaSyDMGk_SFlEto93zfGHUbVLwxYiSq00aknk",
    databaseURL: "https://jste-9584c.firebaseio.com/"
};
module.exports = firebase.initializeApp(config)