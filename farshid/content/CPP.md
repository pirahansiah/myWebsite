---
layout: default
title: "C++ "
date_modified: 2024-10-14
categories: [image-processing, LLM , computer-vision]
tags: [AI, deep-learning, image-processing]
description: "An exploration of advanced algorithms and techniques in computer vision, ML, DL, LLM, LLMOPs, DevOps."
excerpt: "Dive deep into the latest advancements in computer vision, including deep learning methodologies and real-time image processing."
author: "Dr. Farshid Pirahansiah"
---

C++

### hash
std::map<string,int> prices;
prices['aa']=310;
prices={'aa':310, 'bb':410}

### stack
std::stack<int> stk;
stk.push(5);
stk.pop(); //5

### queue 
std::queue<int> q;
q.push(5); ... 89
q.pop(); //5




from collections import deque
stk=deque()
stk.append('asadfas')
stk.pop() 
- o(n)
stk=[]
stk.pop().rstk[-1]

collections import lifo
deque()
appendLeft(5)
pop




### stack
- automatically managed 
- LIFO
- at compile time
- short term
- 8 MB : 8192 kb
- fast
- ulimit_a : show memory
- push / pop



### heap
- need managed by yourself
- if we need to use more than 8 MB we need to use heap
- run time;
- dynamic
- long time
- new/delete
- slower
- pointer 



- pmap 'pidof _____' | tail _n1 | grep_o '[0-9]*' | awk '{print $ 0/(1024*1024)" [GiB]"}'
- tools 
    - valgrind ./my_program
    - fsanitize = address

- echo %errorlevel%
- gflags /i  print+Greeting.ext +sls
- cdb printGreeting.ext




- start with "/" is absolute path
- start with "folder/file..." is relative path
- "/" is root
- "~" is home folder
- "." is current folder
- ".." is parent folder

- [a-c] is abc
- grep & ls.txt search inside file
- ";" calls all command one after
- && same but if error strop next
- "|" pipe

- htop
- struct like class that all members is public using for simple data
- 

### log level
1- debug
2- trace
3- info
4- critical
5- error
6- warning

- basic log
- defined


unit test
google test
md5sum

# git
- git fixes #xx
