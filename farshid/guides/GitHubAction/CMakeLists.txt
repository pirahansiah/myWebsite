cmake_minimum_required(VERSION 3.24)
project(cuda_opencv_versions LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CUDA_STANDARD 17)

if (MSVC)
  set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded")  # static /MT runtime
endif()

find_package(CUDAToolkit REQUIRED)
find_package(OpenCV 4 REQUIRED COMPONENTS core)

add_executable(cuda_opencv_versions src/main.cu)
target_link_libraries(cuda_opencv_versions PRIVATE CUDA::cudart ${OpenCV_LIBS})
target_include_directories(cuda_opencv_versions PRIVATE ${OpenCV_INCLUDE_DIRS})

# Optional: compile for several GPU archs (doesn't require a GPU to build)
set_target_properties(cuda_opencv_versions PROPERTIES CUDA_ARCHITECTURES "75;86;89;90")