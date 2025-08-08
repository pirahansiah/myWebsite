#include <iostream>
#include <cuda_runtime.h>
#include <cuda.h>
#include <opencv2/core.hpp>

static std::string decodeCudaVersion(int v) {
    int major = v / 1000;
    int minor = (v % 1000) / 10;
    return std::to_string(major) + "." + std::to_string(minor);
}

int main() {
    int driverVersion = 0, runtimeVersion = 0;
    cudaError_t rc1 = cudaDriverGetVersion(&driverVersion);
    cudaError_t rc2 = cudaRuntimeGetVersion(&runtimeVersion);

    std::cout << "CUDA driver rc=" << (int)rc1
              << " version=" << driverVersion
              << " (" << decodeCudaVersion(driverVersion) << ")\n";

    std::cout << "CUDA runtime rc=" << (int)rc2
              << " version=" << runtimeVersion
              << " (" << decodeCudaVersion(runtimeVersion) << ")\n";

    std::cout << "OpenCV version: " << CV_VERSION
              << " (cv::getVersionString=" << cv::getVersionString() << ")\n";
    return 0;
}