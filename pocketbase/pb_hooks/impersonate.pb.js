routerAdd("POST", "/impersonate", (c) => {
  const data = new DynamicModel({
    email: "",
  })

  // read the request into the data variable
  c.bind(data)

  // find the user associated with the email
  const user = $app.dao().findAuthRecordByEmail("users", data.email)

  // generate an auth token and return it together with the the user as response
  return $apis.recordAuthResponse($app, c, user, null);
}, $apis.requireAdminAuth())