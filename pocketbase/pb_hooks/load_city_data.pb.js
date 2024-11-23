routerAdd('POST', '/load-city-data', (c) => {

  const dao = $app.dao();
  const collection = dao.findCollectionByNameOrId('places');
  const cities = require('/lists/cities.json');


  var count = 0;
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
      count++;
    } catch (e) {
      console.log('Error occurred while inserting', cities[i].name);
    }
  }
  return c.json(200, { 'count': count });
}, $apis.requireAdminAuth());