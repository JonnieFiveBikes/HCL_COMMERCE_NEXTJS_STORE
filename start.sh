#!/bin/bash 
cd /app
nohup sh -c yarn mock &
yarn dev
