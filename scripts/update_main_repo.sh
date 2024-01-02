if [ -z $1 ]
then
    echo "ERROR: You must provide the path to a checkout of jetlag::main"
    return
fi
# npm run build-docs
rm -rf $1/docs
cp -R docs $1
rm -rf $1/src/game $1/src/jetlag
cp -R src/game $1/src
cp -R src/jetlag $1/src
