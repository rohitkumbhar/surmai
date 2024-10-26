#!/usr/bin/env sh

# Run the migrations first
/pb/pocketbase --migrationsDir=/pb_migrations migrate up

# Start the server with automigrate off
/pb/pocketbase serve --http=0.0.0.0:8080 \
	--dir=/pb_data \
	--publicDir=/pb_public \
	--hooksDir=/pb_hooks \
	--migrationsDir=/pb_migrations \
	--automigrate=false \
	--dev

