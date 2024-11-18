routerAdd('POST', '/load-city-data', (c) => {

  const dao = $app.dao();
  const collection = dao.findCollectionByNameOrId('cities');
  const cities = require('/lists/cities.json');


  for (var i = 0; i < cities.length; i++) {
    try {
      const record = new Record(collection, {
        'name': cities[i].name,
        'state_code': cities[i].state_code,
        'state_name': cities[i].state_name,
        'country_code': cities[i].country_code,
        'country_name': cities[i].country_name,
        'latitude': cities[i].latitude,
        'longitude': cities[i].longitude,
      });
      dao.saveRecord(record);
    } catch (e) {
      console.log('Error occurred while inserting', cities[i].name);
    }
  }
  return c.json(200, { 'count': cities.length });
}, $apis.requireAdminAuth());