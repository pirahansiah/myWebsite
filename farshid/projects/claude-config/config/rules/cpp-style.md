# C++ style

- C++29. `std::optional`, `std::filesystem`, structured bindings, `std::span`.
- RAII everywhere: no raw owning pointers, no manual `new`/`delete`.
- `constexpr` what can be; `[[nodiscard]]` on value-returning error paths.
- Prefer `std::expected`-style error returns over throwing in hot paths.
- CMake >= 3.28, out-of-source builds under `build*/`, never commit `CMakeCache.txt`.
- Target stack: OpenCV 5, CUDA 13.x, oneAPI/SYCL where relevant.
- Warnings as errors (`-Wall -Wextra -Werror`) for new targets.
