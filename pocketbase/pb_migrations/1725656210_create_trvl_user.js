migrate((db) => {

  const userEmail = process.env.TRVLG_EMAIL
  const password = process.env.TRVLG_PASSWORD

  if (!userEmail || !password) {
    const errorMessage = "User email and password are required. Please set the environment variables TRVLG_EMAIL and TRVLG_PASSWORD";
    console.log(errorMessage)
    throw new Error(errorMessage)
  }

  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("users")

  const record = new Record(collection)
  record.setUsername("u_" + $security.randomStringWithAlphabet(5, "123456789"))
  record.setPassword(password)
  record.set("name", "John Doe")
  record.set("email", userEmail)

  dao.saveRecord(record)
}, (db) => { // optional revert
  const dao = new Dao(db);

  try {
    const record = dao.findAuthRecordByEmail("users", "test@example.com")
    dao.deleteRecord(record)
  } catch (_) { /* most likely already deleted */
  }
})