migrate((db) => {

  const collectionSchema = {
    name: 'places',
    type: 'base',
    system: false,
    schema: [
      {
        system: false,
        id: 't1yg719g',
        name: 'name',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        system: false,
        name: 'stateCode',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        system: false,
        name: 'stateName',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        system: false,
        name: 'countryCode',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        system: false,
        name: 'countryName',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        system: false,
        name: 'latitude',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
      {
        system: false,
        name: 'longitude',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: '',
        },
      },
    ],
    indexes: [
      "CREATE INDEX `idx_place_name` ON `places` (`name`)",
      "CREATE UNIQUE INDEX `idx_wUWSzHG` ON `places` (`name`,`stateName`,`countryName`)"
    ],
    listRule: '',
    viewRule: '',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {},
  };
  const dao = new Dao(db);
  dao.saveCollection(new Collection(collectionSchema));

}, (db) => { // optional revert
  return null;
});
