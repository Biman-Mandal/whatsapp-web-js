const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { Client, LocalAuth } = require("whatsapp-web.js");

// Global Client Variable
global.client = {};

// Initialize a new client instance
router.post('/initialize', async (req, res) => {
    client[req.body.workspace_id] = null;
    try {
        fs.rmSync(path.join(__dirname, '../whatsapp_sessions/session-'+req.body.workspace_id), { recursive: true });
        await client[req.body.workspace_id].disconnect();
    } catch (err) {}

    client[req.body.workspace_id] = new Client({
        restartOnAuthFail: true,
        authStrategy: new LocalAuth({
          clientId : req.body.workspace_id,
          dataPath :  path.join(__dirname, '../whatsapp_sessions')
        }),
        puppeteer: { headless: true },
    });

    client[req.body.workspace_id].initialize().catch((err)=>{
        console.log('error');
    });

    var file_path = path.join(__dirname, '../qr/'+req.body.workspace_id+'.qr');
    client[req.body.workspace_id].on("qr", (qrcode) => {
        fs.writeFileSync(file_path, qrcode);
        console.log('qr generated');
    });

    client[req.body.workspace_id].on("authenticated", () => {
        console.log('authenticated');
        try {
            fs.unlinkSync(file_path);
        } catch (err) {}
    });

    client[req.body.workspace_id].on("auth_failure", () => {
        console.log("AUTH Failed !");
    });
      
    client[req.body.workspace_id].on("ready", () => {
        console.log("Client is ready!");
    });

    client[req.body.workspace_id].on("disconnected", () => {
         console.log("disconnected");
    });
    res.send('on process')
});

// Get QR Code From Workspace ID
router.get('/qr', async(req, res) => {
    var workspace_id = req.body.workspace_id;
    var file_path = path.join(__dirname, '../qr/'+workspace_id+'.qr');
    
    let client_obj = client[workspace_id];
    try {
        client_obj.getState().then((data) => {
            if(data){
                res.send("authenticated");
            }else{
                try {
                    var data = fs.readFileSync(file_path).toString();
                    res.send(data);
                } catch (error) {
                    res.status(400).send('Qr Not Found')
                }
            }
        }).catch((error) => {
            res.status(500).send('Client Not Initialized');
        });
    } catch (error) {
        res.status(500).send('Client Not Initialized');
    }
});

module.exports = router;

