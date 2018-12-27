const firebase = require('../utils/firebase.js');
async function getModel() {
    const model = await firebase.database().ref('NLP').once('value')
    return model.val()
}
module.exports = getModel