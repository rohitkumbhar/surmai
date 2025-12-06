# Surmai Backend

The backend is powered by [PocketBase](https://pocketbase.io), an open source Go backend

## Run in development

1. Install the packages

```bash
go mod tidy
```

2. Ensure environment variables can be loaded in so that you have an accessible admin account on first run.

You can either export them into your shell or make use of [GoDotEnv](https://github.com/joho/godotenv) by copying or renaming [dot-env](./dot-env) to .env. DO NOT COMMIT THIS FILE!

3. Run it

```bash
go run . serve
go run . serve --http 0.0.0.0:8060 # specify port number
```
