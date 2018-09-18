# Clear the existing docs folder
rm -rf docs
# Build the docs with typedoc... if you don't have typedoc installed, this
# will break.
typedoc --out ./docs --name "JetLag Documentation" ./src/jetlag/
# If you wanted to serve the current documentation locally, you could type
# this (assuming you have the http-server package installed):
# http-server -c-1 -p8001 ./docs
