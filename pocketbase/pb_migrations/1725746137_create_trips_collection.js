migrate((db) => {

  const collectionSchema = {
    "id": "mi831epro60nwrd",
    "name": "trips",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "vwp9x5gr",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 5,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "l98zzf2e",
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
        "id": "oe5g5dnh",
        "name": "startDate",
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
        "id": "u37ucntp",
        "name": "endDate",
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
        "id": "ac62ix2e",
        "name": "ownerId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "ke7nya2x",
        "name": "coverImage",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [],
          "thumbs": [],
          "maxSelect": 1,
          "maxSize": 5242880,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "t9qfups4",
        "name": "participants",
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
        "id": "wefspvk5",
        "name": "destinations",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      }
    ],
    "indexes": [],
    "listRule": "ownerId = @request.auth.id",
    "viewRule": "ownerId = @request.auth.id",
    "createRule": "",
    "updateRule": "ownerId = @request.auth.id",
    "deleteRule": "ownerId = @request.auth.id",
    "options": {}
  }
  const dao = new Dao(db);
  dao.saveCollection(new Collection(collectionSchema));

}, (db) => { // optional revert
  return null;
})
