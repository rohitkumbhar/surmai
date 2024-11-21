migrate((db) => {

  const dao = Dao(db);
  const collection = dao.findCollectionByNameOrId('airports');
  const airports = require('/lists/airports.json');

  for (var i = 0; i < airports.length; i++) {
    const record = new Record(collection, {
      'name': airports[i].name,
      'iata_code': airports[i].iata_code,
      'iso_country': airports[i].iso_country,
      'latitude_deg': airports[i].latitude_deg,
      'longitude_deg': airports[i].longitude_deg,
    });
    dao.saveRecord(record);
  }
}, (db) => {
  return null;
});
