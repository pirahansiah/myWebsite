---
layout: farshid_default
title: "Modern C++ for Image Processing"
permalink: /notes/courses/modern-cpp/
description: "Modern C++23 for image processing: memory management, design patterns, CUDA, and OpenCV."
---

Modern C++23 for image processing: memory management, design patterns, CUDA, and OpenCV.

# Advanced Programming with Modern C++ 23 for Image Processing

## Key Topics

### Memory Management
- Call by value (stack) vs call by reference (heap)
- Stack: LIFO, compile-time, 8MB limit, fast
- Heap: manual management, runtime, dynamic, slower
- Tools: valgrind, fsanitize

### Design Patterns (Gang of Four)
**Creational (5):** Factory method, Abstract factory, Builder, Prototype, Singleton
**Structural (7):** Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy
**Behavioral (12):** Chain of responsibility, Command, Mediator, Observer, Interpreter, State, Strategy, Template method, Visitor, Iterator, Memento, Null-object

### Smart Pointers
- `std::unique_ptr` — exclusive ownership
- `std::shared_ptr` — shared ownership
- `std::weak_ptr` — non-owning reference
- Rule of five for custom memory management

### Compilation
- CUDA Jetson: `nvcc -std=c++14 -arch=sm_62 -o main.run main.cu`
- C++20 modules: `clang++ -std=c++2a -c file.cpp -Xclang -emit-module-interface -o file.pcm`

## OpenCV C++ Tips
- `cv::Mat` is a smart pointer — use `.clone()` for deep copy in vectors
- `imagesVector.push_back(imageMat.clone());`

#OpenCV #C++ #tiziran #CPlusPlus