File created by Eric for documenting potential commands needed to set up workspace properly.

#1: All files shows "Modified" when workspace is not modified.
    Solution: Run `git diff` and see if all the changes are 'Old mode: 100xxx New mode: 100xxx'. If so, 
    run `git config core.filemode false` to ignore executable bit change.

#2: error: cannot lock existing remote/branchname when trying to push your commits
    Solution: Run `git remote prune origin` and see if that fixes the issue. If not, run
    `git gc --prune=now` to clear loose objects. 


More faqs of weird quirks incoming as I discover them. 