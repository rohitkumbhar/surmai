migrate((db) => {

  const dao = Dao(db)
  const collection = dao.findCollectionByNameOrId("users")

  collection.schema.addField(new SchemaField({
    name: "colorScheme",
    type: "text",
  }));

  collection.schema.addField(new SchemaField({
    name: "currencyCode",
    type: "text",
  }))

  return dao.saveCollection(collection)

}, (db) => {
  return null;
})
