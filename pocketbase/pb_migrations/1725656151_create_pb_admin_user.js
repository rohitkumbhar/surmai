migrate((db) => {

  const adminEmail = process.env.PB_ADMIN_EMAIL
  const adminPassword = process.env.PB_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    const errorMessage = "Admin email and password are required. Please set the environment variables PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD";
    console.log(errorMessage)
    throw new Error(errorMessage)
  }

  const admin = new Admin()
  admin.email = adminEmail
  admin.setPassword(adminPassword);
  return Dao(db).saveAdmin(admin)

}, (db) => {
  const dao = new Dao(db)

  const admin = dao.findAdminByEmail("test@example.com")

  return dao.deleteAdmin(admin)
})
