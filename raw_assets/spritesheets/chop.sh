#!/bin/bash

## halt on any error
set -e 

## Ensure 4 args, validate filename
if [ "$#" -ne  4 ]; then
    echo "Usage: $0 input_filename #64rows #128rows #192rows"
    exit
fi
if ! [ -f $1 ]; then
    echo "Error: input file \"$1\" not found"
fi

## Rename command-line args
sm_rows=$2                      # Number of 64x64 rows
md_rows=$3                      # Number of 128x128 rows
lg_rows=$4                      # Number of 192x192 rows
fname=$1                        # Input filename
base=`basename -s .png $fname`  # Basename for output files

# get image dims
w=`identify -ping -format '%w' $fname`
h=`identify -ping -format '%h' $fname`

## Helper vars
first_sm=0
first_md=$(( $sm_rows * 64 ))
first_lg=$(( $md_rows * 128 + $first_md ))
sm_cols=$(( $w/64 ))
md_cols=$(( $w/128 ))
lg_cols=$(( $w/192 ))

# Extract the small images
for (( y = 0; $(( y * 64 )) < $first_md; y += 1 )); do
    for (( x = 0; $(( x * 64 )) < $w; x += 1)); do
        echo "converting $y $x"
        convert -extract 64x64+$(( $x*64 ))+$(( $y*64 )) $fname $base.sm.$y.$x.png
    done
done

# Extract the medium images
for (( y = $first_md; y < $first_lg; y += 128 )); do
    for (( x = 0; $(( x * 128 )) < $w; x += 1)); do
        echo "converting $y $x"
        convert -extract 128x128+$(( $x*128 ))+$(( $y )) $fname $base.md.$(( (y - $first_md)/128 )).$x.png
    done
done

# Extract the large images
for (( y = $first_lg; y < $h; y += 192 )); do
    for (( x = 0; $(( x * 192 )) < $w; x += 1)); do
        echo "converting $y $x"
        convert -extract 192x192+$(( $x*192 ))+$(( $y )) $fname $base.lg.$(( (y - $first_lg)/192 )).$x.png
    done
done