const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const axios   = require('axios');

router.get('/get', async(req, res)=>{
    console.log(client[req.body.workspace_id][req.body.connection_no]);
    try {
        client[req.body.workspace_id][req.body.connection_no].getContacts().then((contacts) => {
            res.send({
                'status' : 200,
                'data'   : 'all_contacts',
                'message': {
                    'workspace_id'   : req.body.workspace_id,
                    'connection_no'  : req.body.connection_no,
                    'contacts' : contacts
                }
            });
        }).catch((error)=>{
                res.status(500).send({
                    'status' : 'error',
                    'data'   : 'error',
                    'message': 'Error In data save'
                });
        });
    } catch (error) {
        res.send({'status': 'error'})
    }
});
module.exports = router;
