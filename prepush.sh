#!/usr/bin/env bash
# Hail the glorieous BASH
if git add docs/ -A -n | grep -q docs
then
    git add docs/ -A    # -n flag is dry run
    git commit --amend -m "$(git log --format=%B -n1)" -m "[updatedDoc]" --no-verify
else
    echo "No Doc changes detected in current work tree. Skipping doc update!"
fi
