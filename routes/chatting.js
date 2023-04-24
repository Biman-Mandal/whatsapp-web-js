const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const v_url   = require('valid-url');
const { MessageMedia, Location } = require("whatsapp-web.js");
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

router.post('/sendImage/:phone', async (req,res) => {
    let phone   = req.params.phone;
    let image   = req.body.image;
    let caption = req.body.caption;
    if (phone == undefined || image == undefined) {
        res.status(500).send({ status: "error", message: "Please enter valid phone and url of image" })
    } else {
        if (v_url.isWebUri(image)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }

            var path = './temp/' + image.split("/").slice(-1)[0]
            media_downloader(image, path, () => {
                let media = MessageMedia.fromFilePath(path);
                client[req.body.workspace_id][req.body.connection_no].sendMessage(`${phone}@c.us`, media, { caption: caption || '' }).then((response) => {
                    if (response.id.fromMe) {
                        fs.unlinkSync(path)
                    }
                    console.log('image sent'+req.body.workspace_id+' '+req.body.connection_no)
                }).catch((err) =>{
                    console.log('error sending image'+req.body.workspace_id+' '+req.body.connection_no)
                });
            })
            res.send({
                'status' : 200,
                'data'   : 'send_image',
                'message': {
                    'workspace_id'   : req.body.workspace_id,
                    'connection_no'  : req.body.connection_no,
                    'message' : 'Image Sent Successfully'
                }
            });
        } else {
            res.status(500).send({ status:'error', message: 'Invalid URL' })
        }
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