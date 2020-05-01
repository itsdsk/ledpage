cmake_minimum_required (VERSION 2.8)

project (main)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
include_directories("${PROJECT_BINARY_DIR}")

# BOOST
find_package(Boost COMPONENTS thread system REQUIRED)
include_directories(${Boost_INCLUDE_DIRS})
link_directories(${Boost_LIBRARY_DIRS})

# PI SoC
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${CMAKE_CURRENT_SOURCE_DIR}/cmake)
include_directories(${BCM_INCLUDE_DIRS})
include_directories("/opt/vc/include")

# WEBSOCKET
include_directories(thirdparty/websocketpp)

# SERIAL
include_directories(thirdparty/serial/include)
set(serial_SOURCES thirdparty/serial/src/serial.cc thirdparty/serial/include/serial/serial.h thirdparty/serial/include/serial/v8stdint.h)
list(APPEND serial_SOURCES thirdparty/serial/src/impl/unix.cc)
add_library(serial ${serial_SOURCES})
target_link_libraries(serial rt)

# Find the BCM-package (VC control)
find_package(BCM REQUIRED)

# find pigpio
find_package(pigpio REQUIRED)
include_directories(${pigpio_INCLUDE_DIRS})

set(main_SOURCES
    main.cpp
)

add_executable( ${PROJECT_NAME} ${main_SOURCES})

target_link_libraries(main ${BCM_LIBRARIES} serial ${Boost_LIBRARIES} bcm2835 ${pigpio_LIBRARY})