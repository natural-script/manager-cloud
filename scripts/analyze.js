const firebase = require('../utils/firebase.js');
const request = require('request-promise-native');
const dialogflow = require('dialogflow');
const uuid = require('uuid');
const structjson = require('../utils/structjson.js');
const translatorCommonOpts = {
    method: 'POST',
    baseUrl: 'https://api.cognitive.microsofttranslator.com/',
    url: 'translate',
    qs: {
        'api-version': '3.0',
        'to': 'en'
    },
    headers: {
        'Ocp-Apim-Subscription-Key': process.env.TRANSLATOR_API_KEY,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuid.v4().toString()
    },
    json: true,
};
async function analyze(text) {
    const ref = firebase.database().ref('NLP')
    const cachedXLanghData = await ref.orderByChild('text').equalTo(text).once('value')
    if (cachedXLanghData.exists()) {
        const data = Object.values(cachedXLanghData.val())[0].data
        return data
    } else {
        let options = translatorCommonOpts
        options.body = [{
            'text': text
        }]
        const translationResult = (await request(options))[0]
        const originalLanguage = translationResult.detectedLanguage.language
        const translatedText = translationResult.translations[0].text
        const cachedEnglishhData = await ref.orderByChild('text').equalTo(translatedText).once('value')
        if (cachedEnglishhData.exists()) {
            const data = Object.values(cachedEnglishhData.val())[0].data
            ref.push({
                text: text,
                lang: originalLanguage,
                data: data
            })
            return data
        } else {
            const sessionId = uuid.v4();
            const sessionClient = new dialogflow.SessionsClient();
            const sessionPath = sessionClient.sessionPath(process.env.GOOGLE_PROJECT_ID, sessionId);
            const dialogflowRequest = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: translatedText,
                        languageCode: 'en-US',
                    }
                }
            };
            const responses = await sessionClient.detectIntent(dialogflowRequest);
            const result = responses[0].queryResult
            const id = result.intent.displayName
            const parameters = structjson.structProtoToJson(result.parameters)
            const data = {
                id,
                ...parameters
            }
            ref.push({
                text: text,
                lang: originalLanguage,
                data: data
            })
            if (originalLanguage != 'en') {
                ref.push({
                    text: translatedText,
                    lang: 'en',
                    data: data
                })
            }
            return data
        }
    }
}
module.exports = analyze;
analyze('open WIFI')