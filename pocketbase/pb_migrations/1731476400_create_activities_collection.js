migrate((db) => {

  const collectionSchema = {
    "name": "activities",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "pzgdleai",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "vnjx4vtr",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fqi1sx9b",
        "name": "startTime",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "vcwygmdd",
        "name": "trip",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "mi831epro60nwrd",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "m4xcdzse",
        "name": "cost",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "9hhgkhhq",
        "name": "attachments",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [],
          "thumbs": [],
          "maxSelect": 99,
          "maxSize": 5242880,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "lxsdgplb",
        "name": "address",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    "viewRule": "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    "createRule": "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    "updateRule": "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    "deleteRule": "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    "options": {}
  }
  const dao = new Dao(db);
  dao.saveCollection(new Collection(collectionSchema));

}, (db) => { // optional revert
  return null;
})
