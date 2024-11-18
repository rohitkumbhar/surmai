migrate((db) => {

  const collectionSchema = {
    'id': 'y7cs5buq6v5r8tz',
    'name': 'airports',
    'type': 'base',
    'system': false,
    'schema': [
      {
        'system': false,
        'id': 'ys2j9nw8',
        'name': 'name',
        'type': 'text',
        'required': false,
        'presentable': false,
        'unique': false,
        'options': {
          'min': null,
          'max': null,
          'pattern': '',
        },
      },
      {
        'system': false,
        'id': 'ctk3ktah',
        'name': 'iata_code',
        'type': 'text',
        'required': false,
        'presentable': false,
        'unique': false,
        'options': {
          'min': null,
          'max': null,
          'pattern': '',
        },
      },
      {
        'system': false,
        'id': 'fzty3myw',
        'name': 'iso_country',
        'type': 'text',
        'required': false,
        'presentable': false,
        'unique': false,
        'options': {
          'min': null,
          'max': null,
          'pattern': '',
        },
      },
      {
        'system': false,
        'id': 'evb9z6ul',
        'name': 'latitude_deg',
        'type': 'text',
        'required': false,
        'presentable': false,
        'unique': false,
        'options': {
          'min': null,
          'max': null,
          'pattern': '',
        },
      },
      {
        'system': false,
        'id': 'lmroskma',
        'name': 'longitude_deg',
        'type': 'text',
        'required': false,
        'presentable': false,
        'unique': false,
        'options': {
          'min': null,
          'max': null,
          'pattern': '',
        },
      },
    ],
    'indexes': [
      'CREATE INDEX `idx_089yvb8` ON `airports` (`name`)',
      'CREATE INDEX `idx_iKDBL6r` ON `airports` (`iata_code`)',
    ],
    'listRule': '',
    'viewRule': '',
    'createRule': null,
    'updateRule': null,
    'deleteRule': null,
    'options': {},
  };
  const dao = new Dao(db);
  dao.saveCollection(new Collection(collectionSchema));

}, (db) => { // optional revert
  return null;
});
