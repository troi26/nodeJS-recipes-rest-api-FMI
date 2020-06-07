const express = require('express');
const sendErrorResponse = require('./utils').sendErrorResponse;
const replaceId = require('./utils').replaceId;
const indicative = require('indicative');
const util = require('util');
const ObjectID = require('mongodb').ObjectID;

const router = express.Router();
const collection = 'recipes';

// recipes API Feature
router.get('/', (req, res) => {
    req.app.locals.db.collection(collection).find().toArray().then(recipes => {
        res.json(recipes.map(r => replaceId(r)));
    });
});

router.get('/:id', (req, res) => {
    req.app.locals.db.collection(collection).findOne(new ObjectID(req.params.id)).then(recipe => {
        if (!recipe) {
            sendErrorResponse(req, res, 404, `Recipe with ID=${req.params.id} does not exist`);
        }
        res.json(recipe);
    });
});

router.post('/', function (req, res) {
    const recipe = req.body;
    indicative.validator.validate(recipe, {
        authorId: 'required|string|min:24|max:24',
        name: 'required|string|max:80',
        shortDescription: 'string|max:256',
        cookingTime: 'required|integer',
        photoPath: 'string',
        cookingTime: 'integer',
        detailedDescription: 'max:2048',
    }).then(() => {
        recipe.createdAt = new Date();
        recipe.modifiedAt = new Date();
        req.app.locals.db.collection(collection).insertOne(recipe).then(r => {
            if (r.result.ok && r.insertedCount === 1) {
                delete  recipe._id;
                recipe.id = r.insertedId;
                console.log(`Created recipe: ${recipe}`);
                res.status(201).location(`/recipes/${recipe.id}`).json(recipe);
            } else {
                sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
            }
        }).catch(err => {
            console.log("Error: Creation unsuccessfull.");
            sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
        });
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid recipe data: ${util.inspect(errors)}`);
    });
})

router.put('/:id', (req, res) => {
    const recipeId = req.params.id;
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
        db.collection(collection).findOne({_id: objectID}).then((r) => {
            if (!r) {
                sendErrorResponse(req, res, 404, `Recipe with ID=${recipeId} does not exist`);
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
        sendErrorResponse(req, res, 400, `Invalid recipe data: ${util.inspect(errors)}`);
    });
});

router.delete('/:id', (req, res) => {
    req.app.locals.db.collection(collection).findOne(new ObjectID(req.params.id)).then(recipe => {
        if (!recipe) {
            sendErrorResponse(req, res, 404, `Recipe with ID=${req.params.id} does not exist`);
        } else {
            req.app.locals.db.collection(collection).deleteOne({_id: new ObjectID(req.params.id)}).then(old => {
                console.log(`Deleted recipe: ${JSON.stringify(recipe)}`);
                res.json(recipe);
            });
        }
    });
});

module.exports = router;