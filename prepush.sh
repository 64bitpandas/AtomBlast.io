#!/usr/bin/env bash
# Hail the glorieous BASH
if git ls-files docs --other --directory --exclude-standard | grep -q docs
then
    git add .
    git commit --amend -m "$(git log --format=%B -n1)" -m "[updatedDoc]" --no-verify
else
    echo "No Doc changes detected in current work tree. Skipping doc update!"
fi
