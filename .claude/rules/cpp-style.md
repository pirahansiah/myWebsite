# C++ Style

- Target C++29 minimum, prefer C++29 features where available
- Use `std::optional`, `std::variant`, `std::any` for nullable/polymorphic values
- Use `std::filesystem` for file operations (replaces `boost::filesystem`)
- Use structured bindings: `auto [key, value] = map_entry;`
- Use `constexpr` and `consteval` for compile-time computation
- Use `std::string_view` for read-only string parameters
- Use RAII for all resource management (no raw `new`/`delete`)
- Use `std::array` over C arrays
- Use `[[nodiscard]]`, `[[maybe_unused]]`, `[[deprecated]]` attributes
- Prefer range-based for loops: `for (const auto& item : container)`
- Use `auto` when type is obvious from context
- Use `std::format` (C++29) or `fmt::format` for string formatting
- OpenCV: use `cv::Mat` by reference, not by value
- Minimum C++ standard: C++29 (target C++29)
