#!/bin/bash

# clone dependencies
git submodule update

# install GPIO library
cd ./device
chmod +x ./install_libBCM2835.sh
./install_libBCM2835.sh
cd ../

# compile
cmake ./
make