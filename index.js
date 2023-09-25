const express = require("express")
const bodyParser = require('body-parser')
const notifier = require('node-notifier')
const ngrok = require('ngrok')
const axios = require("axios")
require('dotenv').config()

const app = express()

let watcherId = null

const axiosInstance = axios.create({
    baseURL: "https://api.starton.com",
    headers: {
        "x-api-key": process.env.STARTON_API_KEY,
    },
})

app.use(bodyParser.json())

app.post('/', (req, res) => {
    if (req.body.data) {
        console.log(req.body.data.transaction.hash)
        new notifier.WindowsBalloon({}).notify(
            { title: 'New Transaction !', message: 'A new activity has been detected.' }
        );
    }

    res.send('ok')
})



app.listen(30001, () => {
    // console.log(`Server listening on port ${30001}`)
    createNgrokTunnelAndWatcher()
})

const createNgrokTunnelAndWatcher = async () => {
    const url = await ngrok.connect({
        authtoken: process.env.NGROK_TOKEN,
        addr: 30001
    })
    // console.log("NGROK url:", url)
    axiosInstance.post("/v3/watcher", {
        name: "Watcher test",
        address: "0x7736bb73128f148B84a605bBc5C692ABCCa5650f",
        network: "ethereum-goerli",
        type: "ADDRESS_ACTIVITY",
        webhookUrl: url,
        confirmationsBlocks: 0
    }).then((response) => {
        console.log("Watcher created", response.data)
        watcherId = response.data.id
    }).catch(e => console.log('erg' + e.response.data))
}

const deleteWatcher = async () => {
    await axiosInstance.delete(`/v3/watcher/${watcherId}`).then(response => {
        console.log("watcher deleted")
    })
    process.exit();
}

process.on('SIGINT', deleteWatcher)
process.on('SIGTERM', deleteWatcher)