migrate((db) => {

  const collectionSchema = {
    name: "lodgings",
    type: "base",
    system: false,
    schema: [
      {
        system: false,
        id: "d5sijoxd",
        name: "type",
        type: "select",
        required: true,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: [
            "hotel",
            "home",
            "vacation_rental",
            "camp_site"
          ]
        }
      },
      {
        system: false,
        id: "lovha5ak",
        name: "name",
        type: "text",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        system: false,
        id: "ttecnvuf",
        name: "address",
        type: "text",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        system: false,
        id: "4oi2n4wu",
        name: "startDate",
        type: "date",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: "",
          max: ""
        }
      },
      {
        system: false,
        id: "lkbtt8sq",
        name: "endDate",
        type: "date",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: "",
          max: ""
        }
      },
      {
        system: false,
        id: "xtdiryjt",
        name: "cost",
        type: "json",
        required: false,
        presentable: false,
        unique: false,
        options: {
          maxSize: 2000000
        }
      },
      {
        system: false,
        id: "e5qpspgr",
        name: "metadata",
        type: "json",
        required: false,
        presentable: false,
        unique: false,
        options: {
          maxSize: 2000000
        }
      },
      {
        system: false,
        id: "wukolg8a",
        name: "trip",
        type: "relation",
        required: false,
        presentable: false,
        unique: false,
        options: {
          collectionId: "mi831epro60nwrd",
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
          displayFields: null
        }
      },
      {
        system: false,
        id: "qnk903tu",
        name: "attachments",
        type: "file",
        required: false,
        presentable: false,
        unique: false,
        options: {
          mimeTypes: [],
          thumbs: [],
          maxSelect: 99,
          maxSize: 5242880,
          protected: false
        }
      },
      {
        system: false,
        id: "nghjrm9q",
        name: "confirmationCode",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      }

    ],
    indexes: [
      "CREATE INDEX `idx_Au6NH37` ON `lodgings` (`trip`)"
    ],
    listRule: "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    viewRule: "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    createRule: "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    updateRule: "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    deleteRule: "trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id",
    options: {}
  }
  const dao = new Dao(db);
  dao.saveCollection(new Collection(collectionSchema));

}, (db) => { // optional revert
  return null;
})
