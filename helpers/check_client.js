module.exports = (req, res, next) =>  {
    try {
        client[workspace_id][connection_no].getState().then((data) => {
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
    };
};