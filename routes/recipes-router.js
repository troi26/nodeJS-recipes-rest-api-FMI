const express = require('express');
const sendErrorResponse = require('./utils').sendErrorResponse;
const sendValidationErrorResponse = require('./utils').sendValidationErrorResponse;
const replaceId = require('./utils').replaceId;
const indicative = require('indicative');
const util = require('util');
const ObjectID = require('mongodb').ObjectID;

const router = express.Router();
const collection = 'recipes';

// recipes API Feature
router.get('/recipes', (req, res) => {
    req.app.locals.db.collection(collection).find().toArray().then(recipes => {
        res.json(recipes.map(r => replaceId(r)));
    });
});

router.get('/:userId/recipes', (req, res) => {
    const authorId = req.params.userId;
    req.app.locals.db.collection(collection).find({authorId}).toArray().then(recipes => {
        res.json(recipes.map(r => replaceId(r)));
    });
});

router.get('/:userId/recipes/:recipeId', (req, res) => {
    const authorId = req.params.userId;
    const recipeId = req.params.recipeId;
    req.app.locals.db.collection(collection).findOne({_id: new ObjectID(recipeId), authorId}).then(recipe => {
        if (!recipe) {
            sendErrorResponse(req, res, 404, `Recipe with ID=${recipeId} of user with ID=${authorId} does not exist`);
        }
        res.json(recipe);
    });
});

router.post('/:userId/recipes', function (req, res) {
    const recipe = req.body;
    indicative.validator.validate(recipe, {
        authorId: 'required|string|min:24|max:24',
        name: 'required|string|max:80',
        shortDescription: 'string|max:256',
        cookingTime: 'required|integer',
        photoPath: 'string',
        detailedDescription: 'max:2048',
    }).then(() => {
        const authorId = req.params.userId;
        recipe.authorId = authorId;
        recipe.createdAt = new Date();
        recipe.modifiedAt = new Date();
        req.app.locals.db.collection(collection).insertOne(recipe).then(r => {
            if (r.result.ok && r.insertedCount === 1) {
                delete  recipe._id;
                recipe.id = r.insertedId;
                console.log(`Created recipe: ${recipe}`);
                res.status(201).location(`/api/recipes/${recipe.id}`).json(recipe);
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

router.put('/:userId/recipes/:recipeId', (req, res) => {
    const recipeId = req.params.recipeId;
    const recipe = req.body;
    if (recipeId !== recipe.id) {
        sendErrorResponse(req, res, 404, `Recipe with ID=${recipe.id} does not match the request\`s ID=${recipeId}`);
    }
    indicative.validator.validate(recipe, {
        authorId: 'required|string|min:24|max:24',
        name: 'required|string|max:80',
        shortDescription: 'string|max:256',
        cookingTime: 'required|integer',
        photoPath: 'string',
        detailedDescription: 'max:2048',
    }).then((recipe) => {
        const db = req.app.locals.db;
        const objectID = new ObjectID(recipeId);
        const authorId = req.params.userId;
        db.collection(collection).findOne({_id: objectID, authorId}).then((r) => {
            if (!r) {
                sendErrorResponse(req, res, 404, `Recipe with ID=${recipeId} of user with ID=${authorId} does not exist`);
            } else {
                recipe.createdAt = r.createdAt;
                recipe.modifiedAt = new Date();
                const newvalues = { $set: recipe};
                db.collection(collection).updateOne({_id: objectID}, newvalues).then((r) => {
                    res.status(200).json(recipe);
                });
            }
        })
    }).catch(errors => {
        sendValidationErrorResponse(req, res, 400, errors);(req, res, 400, errors);
    });
});

router.delete('/:userId/recipes/:recipeId', (req, res) => {
    const authorId = req.params.userId;
    req.app.locals.db.collection(collection).findOne({_id: new ObjectID(req.params.recipeId), authorId}).then(recipe => {
        if (!recipe) {
            sendErrorResponse(req, res, 404, `Recipe with ID=${req.params.recipeId} of user with ID=${authorId} does not exist`);
        } else {
            req.app.locals.db.collection(collection).deleteOne({_id: new ObjectID(req.params.recipeId)}).then(old => {
                console.log(`Deleted recipe: ${JSON.stringify(recipe)}`);
                res.json(recipe);
            });
        }
    });
});

module.exports = router;