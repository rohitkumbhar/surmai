migrate((db) => {

  const collectionSchema = {
    'name': 'cities',
    'type': 'base',
    'system': false,
    'schema': [
      {
        'system': false,
        'id': 't1yg719g',
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
        'id': 'i2nguw4u',
        'name': 'state_code',
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
        'id': 'tbhemluv',
        'name': 'state_name',
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
        'id': 'fkeghsvq',
        'name': 'country_code',
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
        'id': 'ovelojuy',
        'name': 'country_name',
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
        'id': '6kalaiom',
        'name': 'latitude',
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
        'id': 'ecos7nnl',
        'name': 'longitude',
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
      'CREATE INDEX `idx_city_name` ON `cities` (`name`)',
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
