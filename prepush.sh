#!/usr/bin/env bash
# Hail the glorious BASH
if ! git diff-index --quiet HEAD --
then
    git add .
    git commit --amend -m "$(git log --format=%B -n1)" -m "[updatedDoc]" --no-verify
else
    echo "No Doc changes detected in current work tree. Skipping doc update!"
fi
