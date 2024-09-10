migrate((db) => {

  const adminEmail = process.env.TRVLG_ADMIN_EMAIL
  const adminPassword = process.env.TRVLG_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    const errorMessage = "Admin email and password are required. Please set the environment variables TRVLG_ADMIN_EMAIL and TRVLG_ADMIN_PASSWORD";
    console.log(errorMessage)
    throw new Error(errorMessage)
  }

  const admin = new Admin()
  admin.email = adminEmail
  admin.setPassword(adminPassword);
  return Dao(db).saveAdmin(admin)

}, (db) => {
  return null;
})
