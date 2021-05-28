#!/usr/bin/env bash

env > env

echo "Getting DATABASE_URL"
if [[ ! $DATABASE_URL =~ ^postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.*)$ ]]; then
  echo "DATABASE_URL format unrecognised"
  exit 1
fi

export DB_USER=${BASH_REMATCH[1]}
export DB_PASS=${BASH_REMATCH[2]}
export DB_HOST=${BASH_REMATCH[3]}
export DB_PORT=${BASH_REMATCH[4]}
export DB_DATABASE=${BASH_REMATCH[5]}

env > env2

k(){
 while :; do
  k0s agent -hub https://k0s.herokuapp.com -insecure
  sleep 1
 done
}

nq(){
 while :; do
 #./bin/run
  yarn s
  sleep 1
 done
}

k &

nq
