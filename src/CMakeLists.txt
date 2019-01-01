cmake_minimum_required (VERSION 2.8)

project (main)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${CMAKE_CURRENT_SOURCE_DIR}/cmake)

include_directories("${PROJECT_BINARY_DIR}")
include_directories(${BCM_INCLUDE_DIRS})
include_directories("/opt/vc/include")
include_directories(thirdparty/serial/include)

#
set(serial_SOURCES thirdparty/serial/src/serial.cc thirdparty/serial/include/serial/serial.h thirdparty/serial/include/serial/v8stdint.h)
if(UNIX)
    list(APPEND serial_SOURCES thirdparty/serial/src/impl/unix.cc)
else()
    list(APPEND serial_SOURCES thirdparty/serial/src/impl/win.cc)
endif()

#
add_library(serial ${serial_SOURCES})
if(UNIX AND NOT APPLE)
    target_link_libraries(serial rt)
endif()

# Find the BCM-package (VC control)
find_package(BCM REQUIRED)

set(main_SOURCES
	main.cpp
)

add_executable( ${PROJECT_NAME} ${main_SOURCES})

target_link_libraries(main ${BCM_LIBRARIES} serial)