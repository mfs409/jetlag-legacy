npm install --save-dev typedoc
rm -rf ./docs
npx typedoc src/jetlag/*.ts src/jetlag/*/*.ts
npm remove typedoc