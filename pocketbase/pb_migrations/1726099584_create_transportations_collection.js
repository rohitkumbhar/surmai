migrate((db) => {

    const collectionSchema =  {
        "name": "transportations",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "id": "csj35uwi",
                "name": "type",
                "type": "select",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "maxSelect": 1,
                    "values": [
                        "flight",
                        "car",
                        "bus",
                        "boat",
                        "train"
                    ]
                }
            },
            {
                "system": false,
                "id": "nllkxdk6",
                "name": "origin",
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
                "id": "erlluhto",
                "name": "departureTime",
                "type": "date",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "min": "",
                    "max": ""
                }
            },
            {
                "system": false,
                "id": "25gp5a75",
                "name": "destination",
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
                "id": "wz8b4yb1",
                "name": "arrivalTime",
                "type": "date",
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "min": "",
                    "max": ""
                }
            },
            {
                "system": false,
                "id": "boa3qulb",
                "name": "metadata",
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
                "id": "k3d8psyv",
                "name": "trip",
                "type": "relation",
                "required": true,
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
                "id": "xubbeoks",
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
                "id": "z9azfjnb",
                "name": "files",
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
            }
        ],
        "indexes": [
            "CREATE INDEX `idx_trip` ON `transportations` (`trip`)"
        ],
        "listRule": "trip.ownerId = @request.auth.id",
        "viewRule": "trip.ownerId = @request.auth.id",
        "createRule": "trip.ownerId = @request.auth.id",
        "updateRule": "trip.ownerId = @request.auth.id",
        "deleteRule": "trip.ownerId = @request.auth.id",
        "options": {}
    }
    const dao = new Dao(db);
    dao.saveCollection(new Collection(collectionSchema));

}, (db) => { // optional revert
    return null;
})
