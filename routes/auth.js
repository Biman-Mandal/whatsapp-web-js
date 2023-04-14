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

    client[req.body.workspace_id] = new Client({
        restartOnAuthFail: true,
        puppeteer: {
			args: ['--no-sandbox']
		},
        authStrategy: new LocalAuth({
          clientId : req.body.workspace_id,
          dataPath : path.join(__dirname, '../whatsapp_sessions')
        }),
    });

    client[req.body.workspace_id].initialize().catch((err)=>{
        console.log(err);
    });

    var file_path = path.join(__dirname, '../qr/'+req.body.workspace_id+'.qr');
    client[req.body.workspace_id].on("qr", (qrcode) => {
        fs.writeFileSync(file_path, qrcode);
        console.log('qr generated for workspace-' + req.body.workspace_id+' at '+ new Date());
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
    try {
        client[workspace_id].getState().then((data) => {
            if(data){
                console.log(data);
                res.send({
                    'status' : 200,
                    'data'   : 'authenticated',
                    'message': 'authenticated'
                });
            }else{
                try {
                    var data = fs.readFileSync(file_path).toString();
                    res.send({
                        'status'  : 200,
                        'data'    : 'qr',
                        'message' : data
                    });
                } catch (error) {
                    res.status(200).send({
                        'status' : 'error',
                        'data'   : 'qr_not_found',
                        'message': 'QR not found please try after sometime'
                    })
                }
            }
        }).catch((error) => {
            res.status(500).send({
                'status' : 'error',
                'data'   : 'client_not_initialized',
                'message': 'Client Not Initialized'
            });
        });
    } catch (error) {
        res.status(500).send({
            'status' : 'error',
            'data'   : 'client_not_initialized',
            'message': 'Client Not Initialized'
        });
    }
});

// Check Auth 
router.get('/check', (req, res) => {
    var workspace_id = req.body.workspace_id;
    try {
        client[workspace_id].getState().then((data) => {
            if(data){
                res.send({
                    'status' : 200,
                    'data'   : 'authenticated',
                    'message': data
                });
            }else{
                res.send({
                    'status' : 200,
                    'data'   : 'disconnected',
                    'message': data
                });
            }
        }).catch((error) => {
            res.status(500).send({
                'status' : 'error',
                'data'   : 'client_not_initialized',
                'message': 'Client Not Initialized'
            });
        });
    } catch (error) {
        res.status(500).send({
            'status' : 'error',
            'data'   : 'client_not_initialized',
            'message': 'Client Not Initialized'
        });
    }
})

module.exports = router;

