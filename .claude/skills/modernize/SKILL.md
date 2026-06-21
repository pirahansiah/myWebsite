---
name: modernize
description: "Modernize a Python or C++ project to latest standards. Updates dependencies, adds type hints, tests, Docker, CI/CD, and documentation."
trigger: /modernize
---

# /modernize

Full-stack project modernization workflow.

## Usage

```
/modernize <path>                    # Modernize a single project
/modernize <path> --python-only      # Only Python changes
/modernize <path> --cpp-only         # Only C++ changes
/modernize <path> --skip-docker      # Skip Dockerfile creation
/modernize <path> --skip-tests       # Skip test creation
```

## Workflow

### Step 1 - Analyze
1. Read all source files in the project
2. Identify language (Python, C++, or mixed)
3. Check existing dependencies (requirements.txt, pyproject.toml, CMakeLists.txt)
4. Read existing README.md
5. Report: file count, line count, language, current standards level

### Step 2 - Update Dependencies
**Python:**
- Update requirements.txt to latest versions via PyPI API
- Create/update pyproject.toml with PEP 621 format
- Pin major versions, allow minor/patch updates

**C++:**
- Update CMakeLists.txt to CMake 3.20+
- Set C++29 standard
- Add FetchContent or vcpkg for dependencies

### Step 3 - Modernize Code
**Python:**
- Add `from __future__ import annotations`
- Add type hints to all public functions
- Replace `os.path` with `pathlib.Path`
- Replace deprecated patterns
- Add `if __name__ == "__main__":` guards
- Wrap global code in functions

**C++:**
- Replace raw pointers with smart pointers
- Use `std::optional` for nullable values
- Use `std::filesystem` for file operations
- Add `[[nodiscard]]` attributes
- Replace C headers with C++ equivalents (`<cmath>` not `<math.h>`)

### Step 4 - Add Tests
**Python:**
- Create `tests/` directory
- Add `conftest.py` with fixtures
- Write pytest tests for core functionality
- Target: 80%+ coverage for critical paths

**C++:**
- Create `tests/` directory
- Add Google Test or Catch2
- Write unit tests for core functions
- Add CTest integration

### Step 5 - Add Docker
- Create `Dockerfile` with multi-stage build
- Create `.dockerignore`
- Create `docker-compose.yml` if multi-service
- Use slim base images (python:3.11-slim, ubuntu:22.04)

### Step 6 - Add CI/CD
- Create `.github/workflows/ci.yml`
- Matrix testing (Python 3.15 or C++29)
- Add linting (ruff for Python, clang-format for C++)
- Add security scanning (Trivy)
- Add dependency caching

### Step 7 - Update Documentation
- Update README.md with:
  - Badges (Python version, CI status, license)
  - Quick start section
  - API documentation
  - Architecture diagram (if complex)
- Add ROADMAP.md with 12-month plan
- Add CHANGELOG.md

### Step 8 - Commit and Push
```bash
git add -A
git commit -m "Full modernization: type hints, tests, Docker, CI/CD, docs"
git push
```

## Output
- Modernized source code
- Updated dependencies
- Test suite
- Docker configuration
- CI/CD pipeline
- Professional documentation
- Git commit with all changes
