const express = require('express');
const sendErrorResponse = require('./utils').sendErrorResponse;
const replaceId = require('./utils').replaceId;
const indicative = require('indicative');
const ObjectID = require('mongodb').ObjectID;

const router = express.Router();
const collection = 'users';

// users API Feature
router.get('/', (req, res) => {
    req.app.locals.db.collection(collection).find().toArray().then(users => {
        res.json(users.map(u => replaceId(u)));
    });
});

router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    req.app.locals.db.collection(collection).findOne(new ObjectID(userId)).then(user => {
        if (!user) {
            sendErrorResponse(req, res, 404, `User with ID=${userId} does not exist`);
        } else {
            res.status(200).json(user);
        }
    });
});

router.post('/', function (req, res) {
    const user = req.body;
    indicative.validator.validate(user, {
        username: 'required|string|max:15',
        password: 'required|string|min:8',
        gender: 'required|string',
        role: 'required|string',
        avatarUrl: 'string',
        description: 'string|max:512',
        status: 'string',
    }).then(() => {
        user.createdAt = new Date();
        user.modifiedAt = new Date();
        req.app.locals.db.collection(collection).insertOne(user).then(r => {
            if (r.result.ok && r.insertedCount === 1) {
                delete  user._id;
                user.id = r.insertedId;
                console.log(`Created user: ${user}`);
                res.status(201).location(`/api/users/${user.id}`).json(user);
            } else {
                sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
            }
        }).catch(err => {
            console.log("Error: Creation unsuccessfull.");
            sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
        });
    }).catch(errors => {
        sendValidationErrorResponse(req, res, 400, errors);
    });
})

router.put('/:userId', (req, res) => {
    const userId = req.params.userId;
    const user = req.body;
    if (userId !== user.id) {
        sendErrorResponse(req, res, 404, `User with ID=${user.id} does not match the request\`s ID=${userId}`);
    } else {
        indicative.validator.validate(user, {
            username: 'required|string|max:15',
            password: 'required|string|min:8',
            gender: 'required|string',
            role: 'required|string',
            avatarUrl: 'string',
            description: 'string|max:512',
            status: 'string',
        }).then((user) => {
            const db = req.app.locals.db;
            const objectID = new ObjectID(userId);
            db.collection(collection).findOne({_id: objectID}).then((u) => {
                if (!u) {
                    sendErrorResponse(req, res, 404, `User with ID=${userId} does not exist`);
                } else {
                    user.createdAt = u.createdAt;
                    user.modifiedAt = new Date();
                    const newvalues = { $set: user};
                    db.collection(collection).updateOne({_id: objectID}, newvalues).then(() => {
                        res.status(200).json(user);
                    });
                }
            })
        }).catch(errors => {
            sendValidationErrorResponse(req, res, 400, errors);
        });
    }
});

router.delete('/:userId', (req, res) => {
    req.app.locals.db.collection(collection).findOne(new ObjectID(req.params.userId)).then(user => {
        if (!user) {
            sendErrorResponse(req, res, 404, `User with ID=${req.params.userId} does not exist`);
        } else {
            req.app.locals.db.collection(collection).deleteOne({_id: new ObjectID(req.params.userId)}).then(old => {
                console.log(`Deleted user: ${JSON.stringify(user)}`);
                res.json(user);
            });
        }
    });
});

module.exports = router;