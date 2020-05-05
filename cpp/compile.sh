#!/bin/bash

# clone dependencies
git submodule update

# install bcm2835 library
cd ./device
chmod +x ./install_libBCM2835.sh
./install_libBCM2835.sh
cd ../

# install pigpio library
cd ./thirdparty/pigpio
make
sudo make install
cd ../../

# compile
cmake ./
make