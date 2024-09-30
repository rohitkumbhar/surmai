migrate((db) => {

    const dao = Dao(db)
    const collection = dao.findCollectionByNameOrId("users")

    collection.listRule = ""
    collection.viewRule = ""
    dao.saveCollection(collection)
    return dao.saveCollection(collection)

}, (db) => {
    return null;
})
