const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { Client, LocalAuth } = require("whatsapp-web.js");
const axios = require('axios');
// Global Client Variable
global.client = {};

// Initialize a new client instance
router.post('/initialize', async (req, res) => {
    if(client[req.body.workspace_id] == undefined) {
        client[req.body.workspace_id] = {}
    }
    if(client[req.body.workspace_id][req.body.connection_no] == undefined){
        client[req.body.workspace_id][req.body.connection_no] = null;
    }

    client[req.body.workspace_id][req.body.connection_no] = new Client({
        restartOnAuthFail: true,
        puppeteer: {
			args: ['--no-sandbox']
		},
        authStrategy: new LocalAuth({
          clientId : req.body.workspace_id+'-'+req.body.connection_no,
          dataPath : path.join(__dirname, '../whatsapp_sessions')
        }),
    });

    // On Initialize Client
    client[req.body.workspace_id][req.body.connection_no].initialize().then(()=>{
        console.log('initialized');
    }).catch((err)=>{
        console.log(err);
    });

    var file_path = path.join(__dirname, '../qr/'+req.body.workspace_id+'-'+req.body.connection_no+'.qr');
    // On QR generation
    client[req.body.workspace_id][req.body.connection_no].on("qr", (qr_code) => {
        fs.writeFileSync(file_path, qr_code);
        console.log('qr generated for workspace-' + req.body.workspace_id);
    });

    // On Authenticated
    client[req.body.workspace_id][req.body.connection_no].on("authenticated", () => {
        console.log('authenticated');
    });

    client[req.body.workspace_id][req.body.connection_no].on("auth_failure", () => {
        console.log("AUTH Failed !");
    });

    // On send message And Receive Message
    client[req.body.workspace_id][req.body.connection_no].on('message_create', message => {
        let message_create_url = process.env.LARAVEL_BASE_URL+'/api/whatsapp/web-js/';
        axios.post(message_create_url, {
            workspace_id  : req.body.workspace_id,
            connection_no : req.body.connection_no,
            message       : message,
            connection    : 'message_create_api',
        })
        .then(function (response) {
            console.log('success sent to api'+req.body.workspace_id+"-"+req.body.connection_no);
        })
        .catch(function (error) {
            console.log('error axios on message_create');
        });
        console.log('RECEIVED New Message'+req.body.workspace_id+"-"+req.body.connection_no);
    });

    // On receive message 
    client[req.body.workspace_id][req.body.connection_no].on('message', message => {
		// client[req.body.workspace_id][req.body.connection_no].sendMessage(message.from, 'testing new whatsapp web');
    });
       
    // On Client Is Ready
    client[req.body.workspace_id][req.body.connection_no].on("ready", async() => {
        try {
            fs.unlinkSync(file_path);
        } catch (err) {
        }
        // Sending Auth Info To The OChats server
        let connection_route = process.env.LARAVEL_BASE_URL+'/api/whatsapp/web-js/connection';
       
        let client_info = client[req.body.workspace_id][req.body.connection_no].info;
        if(!client[req.body.workspace_id][req.body.connection_no].info){
            await new Promise(resolve => setTimeout(resolve, 10000));
            client_info = client[req.body.workspace_id][req.body.connection_no].info;
        }
        axios.post(connection_route, {
            user_id       : req.body.user_id,
            workspace_id  : req.body.workspace_id,
            connection_no : req.body.connection_no,
            client_details: client_info
        })
        .then(function (response) {
            console.log('success');
        })
        .catch(function (error) {
            console.log('connection axios');
        });
        console.log("Client is ready!");
    });

    // Sending Disconnected Info To The OChats server
    client[req.body.workspace_id][req.body.connection_no].on("disconnected", () => {
        let workspace_id  = req.body.workspace_id;
        let connection_no = req.body.connection_no;
        // Sending Data to the OChats Server
        let disconnected_url = process.env.LARAVEL_BASE_URL+'/api/whatsapp/web-js/';
        axios.post(disconnected_url, {
            workspace_id  : req.body.workspace_id,
            connection_no : req.body.connection_no,
            connection    : 'disconnected'
        }).then(function (response) {
            let directory = path.join(__dirname, '../whatsapp_sessions/session-'+workspace_id+'-'+connection_no);
            // Removing Directory
            if (fs.existsSync(directory)) {
                fs.rmSync(directory, { recursive: true, force: true });
            }
            client[workspace_id][connection_no] = null;
            console.log('success disconnected-'+workspace_id+"-"+connection_no);
        })
        .catch(function (error) {
            console.log(error);
        });
    });
    res.send('on process')
});

// Getting Client Status
router.get('/client-status', (req, res)=> {
    var workspace_id  = req.body.workspace_id;
    var connection_no = req.body.connection_no;
    var file_path     = path.join(__dirname, '../qr/'+ workspace_id+'-'+connection_no+'.qr');
    try {
        client[workspace_id][connection_no].getState().then((data) => {
            if(data){
                res.send({
                    'status' : 200,
                    'data'   : 'authenticated',
                    'message': 'Authenticated successfully'
                });
            }else{
                if (fs.existsSync(file_path)) {
                    var data = fs.readFileSync(file_path).toString();
                    res.send({
                        'status'  : 200,
                        'data'    : 'qr',
                        'message' : data
                    });
                }else{
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
                'data'   : 'disconnected',
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

// Forget Client
router.delete('/delete', async(req, res) => {
    let workspace_id  = req.body.workspace_id;
    let connection_no = req.body.connection_no;
    let directory = path.join(__dirname, '../whatsapp_sessions/session-'+workspace_id+'-'+connection_no);
    // If Client Exists
    try {
       await client[workspace_id][connection_no].logout().then((data)=>{
            if (fs.existsSync(directory)) {
                fs.rmSync(directory, { recursive: true, force: true });
            }
        }).catch((error)=>{
            console.log('error in logout the client');
        });
        
        res.status(200).send({
            'status' : 'success',
            'data'   : 'logout_request_success',
            'message': 'Logout Request Success'
        });
    } catch (error) {
        res.status(500).send({
            'status' : 'error',
            'data'   : 'client_not_initialized',
            'message': 'Client Not Initialized'
        });
    }
   
})

router.get('/initialization', (req, res)=>{
    
});

module.exports = router;