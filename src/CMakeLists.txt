cmake_minimum_required (VERSION 2.8)

project (main)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${CMAKE_CURRENT_SOURCE_DIR}/cmake)

include_directories("${PROJECT_BINARY_DIR}")
include_directories(${BCM_INCLUDE_DIRS})
include_directories("/opt/vc/include")

find_package(BCM REQUIRED)

set(main_SOURCES
	main.cpp
)

add_executable( ${PROJECT_NAME} ${main_SOURCES})

target_link_libraries(main ${BCM_LIBRARIES})