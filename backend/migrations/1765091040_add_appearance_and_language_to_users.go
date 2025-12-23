package migrations

import (
    "github.com/pocketbase/pocketbase/core"
    m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
    m.Register(func(app core.App) error {
        users, err := app.FindCollectionByNameOrId("users")
        if err != nil {
            return err
        }

        saveRequired := false

        if users.Fields.GetByName("websiteAppearance") == nil {
            users.Fields.Add(&core.SelectField{
                Name:      "websiteAppearance",
                Values:    []string{"light", "dark", "auto"},
                MaxSelect: 1,
            })
            saveRequired = true
        }

        if users.Fields.GetByName("preferredLanguage") == nil {
            users.Fields.Add(&core.TextField{
                Name: "preferredLanguage",
            })
            saveRequired = true
        }

        if saveRequired {
            return app.Save(users)
        }
        return nil
    }, func(app core.App) error {
        users, err := app.FindCollectionByNameOrId("users")
        if err != nil {
            return err
        }
        users.Fields.RemoveByName("websiteAppearance")
        users.Fields.RemoveByName("preferredLanguage")
        return app.Save(users)
    })
}
