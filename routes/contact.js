const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

router.get('/get', async(req, res)=>{
    client[req.body.workspace_id].getChats().then((chats)=>{
        console.log(chats);
    })
});

router.get('/info', async(req, res)=>{
    res.send(client[req.body.workspace_id].info);
});

module.exports = router;
