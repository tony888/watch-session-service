#!/bin/bash

ENV=""

# Parse command-line arguments
while getopts "e:" opt; do
  case $opt in
    e) ENV=$OPTARG ;;
    *) echo "Usage: $0 -e <environment>"; exit 1 ;;
  esac
done

FROM_BRANCH=$(git log main --merges --pretty=format:"%s" -n 1 | sed -n "s/^Merge branch '\([^']*\)'.*/\1/p")
echo "Branch name is: $FROM_BRANCH"
echo "Selected environment: $ENV"

if [[ $FROM_BRANCH =~ ^gw/ ]]; then

  echo 'Running gw command...'
  if [[ "$ENV" == "dev" ]]; then
    npm run diff:apigateway:$ENV && npm run deploy:apigateway:$ENV && cd ../apps/gateway && npx semantic-release -e semantic-release-monorepo
  else
    npm run diff:apigateway:$ENV && npm run deploy:apigateway:$ENV
  fi

elif [[ $FROM_BRANCH =~ ^api/ ]]; then

  echo 'Running api command...'
  if [[ "$ENV" == "dev" ]]; then
    npm run diff:backend:$ENV && npm run deploy:backend:$ENV && cd ../apps/watch-session-api && npx semantic-release -e semantic-release-monorepo
  else
    npm run diff:backend:$ENV && npm run deploy:backend:$ENV
  fi

else
  
  echo 'Running cdk command...'
  if [[ "$ENV" == "dev" ]]; then
    npm run diff:$ENV && npm run deploy:$ENV && npx semantic-release
  else
    npm run diff:$ENV && npm run deploy:$ENV
  fi
  
fi