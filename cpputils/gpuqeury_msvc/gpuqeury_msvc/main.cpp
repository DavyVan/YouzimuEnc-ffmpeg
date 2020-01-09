#include <cuda_runtime.h>
#include <iostream>
#include <memory>
#include <string>
#include "json.hpp"

using json = nlohmann::json;

int main(int argc, char **argv) {

	int deviceCount = 0;
	cudaError_t error_id = cudaGetDeviceCount(&deviceCount);

	if (error_id != cudaSuccess) {
		exit(EXIT_FAILURE);
	}

	json j;
	j["devCount"] = deviceCount;
	j["devices"] = json::array();

	int dev, driverVersion = 0, runtimeVersion = 0;

	for (dev = 0; dev < deviceCount; ++dev) {
		cudaSetDevice(dev);
		cudaDeviceProp deviceProp;
		cudaGetDeviceProperties(&deviceProp, dev);

		//printf("\nDevice %d: \"%s\"\n", dev, deviceProp.name);
		j["devices"][dev]["name"] = deviceProp.name;

		// Console log
		cudaDriverGetVersion(&driverVersion);
		cudaRuntimeGetVersion(&runtimeVersion);
		//printf("  CUDA Driver Version / Runtime Version          %d.%d / %d.%d\n",
		//	driverVersion / 1000, (driverVersion % 100) / 10,
		//	runtimeVersion / 1000, (runtimeVersion % 100) / 10);
		//printf("  CUDA Capability Major/Minor version number:    %d.%d\n",
		//	deviceProp.major, deviceProp.minor);
	}
	std::cout << j.dump();
	exit(EXIT_SUCCESS);
}
