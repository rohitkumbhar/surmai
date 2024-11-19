routerAdd('POST', '/load-city-data', (c) => {

  const dao = $app.dao();
  const collection = dao.findCollectionByNameOrId('cities');
  const cities = require('/lists/cities.json');


  for (var i = 0; i < cities.length; i++) {
    try {
      const record = new Record(collection, {
        'name': cities[i].name,
        'stateCode': cities[i].state_code,
        'stateName': cities[i].state_name,
        'countryCode': cities[i].country_code,
        'countryName': cities[i].country_name,
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