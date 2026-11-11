#!/bin/sh
# Runs once, when the database volume is created. The API connects as APP_DB_USER, which owns the
# application database but is NOT a superuser (POSTGRES_USER keeps that role for maintenance only).
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v app_user="$APP_DB_USER" -v app_password="$APP_DB_PASSWORD" -v app_db="$APP_DB_NAME" <<'SQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE :"app_db" OWNER :"app_user";
REVOKE ALL ON DATABASE :"app_db" FROM PUBLIC;
SQL
