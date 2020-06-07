module.exports.sendErrorResponse = function(req, res, status, message, err) {
    if(req.get('env') !== 'development') {
        err = undefined;
    }
    res.status(status).json({
        code: status,
        message,
        error: err
    })
}

module.exports.sendValidationErrorResponse = function(req, res, status, message, err) {
    if(req.get('env') !== 'development') {
        err = undefined;
    }

    res.status(status).json(message);
}


module.exports.replaceId = function (entity) {
    entity.id = entity._id;
    delete entity._id;
    return entity;
}