#!/usr/bin/env bash
function yes_or_no {
    while true; do
        read -p "$* [y/n]: " yn
        case $yn in
            [Yy]*) return 0  ;;  
            [Nn]*) echo "Aborted" ; return  1 ;;
        esac
    done
}

printf 'Working directory: '
pwd
npm run test-env
printf 'Please wait. Lint Checking...'

if ./node_modules/.bin/eslint ./src/; then
    printf 'Linting Passed.'
else
    printf 'linting check failed. Run npm -s run fix-lint.'
    yes_or_no "Attempt autofix above issues? [y/n]: " && npm run fix-lint
fi