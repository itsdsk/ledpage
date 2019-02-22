#!/bin/bash

# clone dependencies
git submodule update

# compile
cmake ./
make