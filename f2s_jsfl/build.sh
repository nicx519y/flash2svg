#!/bin/bash
oldext="js"
newext="jsfl"
dir="src"
outdir="output"

rm -rf $outdir
cp -r $dir $outdir

cd $outdir

for file in $(ls | grep .$oldext)
        do
        name=$(ls $file | cut -d. -f1)
        mv $file ${name}.$newext
        echo "$name.$oldext ====> $name.$newext"
        done
echo "all files has been modified."
