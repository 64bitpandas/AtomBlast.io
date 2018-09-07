File created by Eric for documenting potential commands needed to set up workspace properly.

#1: All files shows "Modified" when workspace is not modified.
    Solution: Run `git diff` and see if all the changes are 'Old mode: 100xxx New mode: 100xxx'. If so, 
    run `git config core.filemode false` to ignore executable bit change.

More faqs of weird quirks incoming as I discover them. 