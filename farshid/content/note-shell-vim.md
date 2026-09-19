---
layout: farshid_default
title: "Shell & Vim Quick Reference"
permalink: /notes/docs/shell-vim/
description: "Quick reference for shell commands, vim basics, and essential CLI tools."
---

Quick reference for shell commands, vim basics, and essential CLI tools.

- [NeoHtop](https://github.com/Abdenasser/neohtop)
- 

- The Shell
    - echo
        - "" \ 
        - $PATH
        - cd -
        
        - ctrl+L to clean 
        - ctrl+r

        - >> append
        - output into | input
        - # into root or sudo su
        - xdg-open opent the file with reletive app
        - foo=bar ; must be without space 
        - echo "value is $foo" -> value is bar
        - echo 'value is $foo' -> value is $foo
        - mcd () {
            mkdir -p "$1"
            cv "$1"
        }
        source mcd.sh
        !!
<!--  -->
command + /
option+shif+a

#!/usr/bin/env python
import sys
for arg in reversed(sys.argv[1:]):
    print(arg)

# tools
tldr
locate 
grep 
ripgrep = rg
fzf
broot
nnn

# vim
 i
 esc
 r
 k
 s-v
 c-v
 :