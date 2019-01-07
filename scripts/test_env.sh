#!/usr/bin/env bash
# Hail the glorieous BASH
if [ -d './src/' ]; then 
    printf 'src directory detected! '; 
else 
    printf '\n\nCRITICAL: src directory NOT DETECTED\nABORTING!!! \n\n' && exit 1; 
fi