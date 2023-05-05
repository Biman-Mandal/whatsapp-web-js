const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const v_url   = require('valid-url');
const { MessageMedia, Location, Message, MessageSendOptions } = require("whatsapp-web.js");
const request = require('request')

router.post('/sendMessage/:phone', async(req, res)=>{
    let phone   = req.params.phone;
    let message = req.body.message;
    client[req.body.workspace_id][req.body.connection_no].sendMessage(phone + '@c.us', message).then((response) => {
        console.log('success message sent'+req.body.workspace_id+' '+req.body.connection_no)
    }).catch((err) =>{
        console.log('error sending message'+req.body.workspace_id+' '+req.body.connection_no)
    });
    res.send({
        'status' : 200,
        'data'   : 'send_message',
        'message': {
            'workspace_id'   : req.body.workspace_id,
            'connection_no'  : req.body.connection_no,
            'message' : 'Message Sent Successfully'
        }
    });
});

router.post('/sendAttachment/:phone', async (req,res) => {
    let phone       = req.params.phone;
    let file_path   = req.body.file_path;
    let caption     = req.body.caption;
    if (phone == undefined || file_path == undefined) {
        res.status(500).send({ status: "error", message: "Please enter valid phone and url of attachment" })
    } else {
        if (v_url.isWebUri(file_path)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }
            var path = './temp/' + file_path.split("/").slice(-1)[0]
            media_downloader(file_path, path, () => {
                let media = MessageMedia.fromFilePath(path);
                client[req.body.workspace_id][req.body.connection_no].sendMessage(`${phone}@c.us`, media, {
                        caption: caption || '', 
                        sendMediaAsDocument: true,
                        sendAudioAsVoice: true
                }).then((response) => {
                    if (response.id.fromMe) {
                        fs.unlinkSync(path)
                    }
                    console.log('Attachment sent'+req.body.workspace_id+' '+req.body.connection_no)
                }).catch((err) =>{
                    console.log(err);
                    console.log('error sending Attachment'+req.body.workspace_id+' '+req.body.connection_no)
                });
            })
            res.send({
                'status' : 200,
                'data'   : 'send_attachment',
                'message': {
                    'workspace_id'   : req.body.workspace_id,
                    'connection_no'  : req.body.connection_no,
                    'message' : 'Attachment Sent Successfully'
                }
            });
        } else {
            res.status(500).send({ status:'error', message: 'Invalid URL' })
        }
    }
});

// Not USED

router.post('/sendAudio/:phone', async (req,res) => {
    let phone       = req.params.phone;
    let file_path   = req.body.file_path;
    if (v_url.isWebUri(file_path)) {
        if (!fs.existsSync('./temp-audio-file')) {
            await fs.mkdirSync('./temp-audio-file');
        }
        var path = './temp/' + file_path.split("/").slice(-1)[0]
        media_downloader(file_path, path, () => {
            let media = MessageMedia.fromFilePath(path);
            client[req.body.workspace_id][req.body.connection_no].sendMessage(`${phone}@c.us`, media, {
                caption: caption || '',
                sendMediaAsDocument: true,
                sendAudioAsVoice: true
            }).then((response) => {
                if (response.id.fromMe) {
                    fs.unlinkSync(path)
                }
                console.log('Audio sent'+req.body.workspace_id+' '+req.body.connection_no)
            }).catch((err) =>{
                // Error Response
                console.log('error sending Audio'+req.body.workspace_id+' '+req.body.connection_no)
            });
        })
            // Sending Response
            res.send({
            'status' : 200,
            'data'   : 'send_audio',
            'message': {
                'workspace_id'   : req.body.workspace_id,
                'connection_no'  : req.body.connection_no,
                'data' : 'Successfully sent audio message.'
            }});
    } else {
        res.status(500).send({ status:'error', message: 'Invalid URL' })
    }
});

const media_downloader = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback)
    })
}

module.exports = router;