#!/usr/bin/env sh

# Check if all required S3 environment variables are available and not empty
if [ -n "${SURMAI_DB_BKP_BUCKET_URL}" ] && [ -n "${SURMAI_DB_BKP_ACCESS_KEY_ID}" ] && [ -n "${SURMAI_DB_BKP_ACCESS_KEY_SECRET}" ]; then

  # If all variables are available, use litestream
  pb_data_dir=${PB_DATA_DIRECTORY:-/pb_data}

  if [ -f ${pb_data_dir} ]; then
  	echo "Database already exists, skipping restore"
  else
  	echo "No database found, restoring from replica if exists"
  	litestream restore -if-db-not-exists -if-replica-exists -o "${pb_data_dir}/data.db" --replica s3 "${pb_data_dir}/data.db"
  fi

  echo "Starting Surmai server with litestream replicate"
  exec litestream replicate -exec "/pb/init.sh"
else
  # Otherwise, just execute init.sh directly
  echo "Starting Surmai Server without Litestream backup"
  exec /pb/init.sh
fi