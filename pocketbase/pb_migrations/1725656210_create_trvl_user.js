migrate((db) => {

  const userEmail = process.env.SURMAI_ADMIN_EMAIL
  const password = process.env.SURMAI_ADMIN_PASSWORD

  if (!userEmail || !password) {
    const errorMessage = "User email and password are required. Please set the environment variables SURMAI_ADMIN_EMAIL and SURMAI_ADMIN_PASSWORD";
    console.log(errorMessage)
    throw new Error(errorMessage)
  }

  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("users")

  const record = new Record(collection)
  record.setUsername("u_" + $security.randomStringWithAlphabet(5, "123456789"))
  record.setPassword(password)
  record.set("emailVisibility", true)
  record.set("name", "Admin User")
  record.set("email", userEmail)

  dao.saveRecord(record)
}, (db) => { // optional revert
  return null;
})