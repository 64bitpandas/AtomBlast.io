#!/usr/bin/env bash
npm run -s env-test
printf 'Please wait. Linting...\n'
if ./node_modules/.bin/eslint ./src/ --fix; then
    printf 'Auto Linting successful! Please test prior to pushing!'
else
    printf 'Auto Linting failed. Please manually fix the above errors.'
    return 1
    exit 1
fi