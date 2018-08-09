#!/usr/bin/env bash
function yes_or_no {
    while true; do
        read -p "$* [y/n]: " yn
        case $yn in
            [Yy]*) npm -s run fix-lint; return 0  ;;  
            [Nn]*) echo "Aborted" ; return  1 ;;
        esac
    done
}
read -p "$* [y/n]: " yn
case $yn in
    [Yy]*) npm -s run fix-lint; return 0  ;;  
    [Nn]*) echo "Aborted" ; return  1 ;;
esac
echo 'Working directory: ' && pwd && echo '\nPlease wait. Lint Checking...\n' && ((npm run env-test && ./node_modules/.bin/eslint ./src/ && echo \"$(tput setaf 2)$(tput setab 0)Linting Passed.$(tput sgr0)\" ) || (yes_or_no "Attempt autofix above issues?" || (echo \"$(tput setaf 5)$(tput setab 0)linting check failed and aborted. Run 'npm run fix-lint' to attemp automatic fix$(tput sgr0)\" && exit 1)))