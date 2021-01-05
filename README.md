# monaco-tm

This gets TextMate grammars working in standalone Monaco by leveraging
`vscode-oniguruma` and `vscode-textmate`. For more context, see:
https://github.com/microsoft/monaco-editor/issues/1915.

## Run demo

- `yarn install`
- `yarn demo`
- open http://localhost:8084/

~~Currently, only the Python grammar and VS Code Dark+ themes are included in the
demo.~~

## About the Fork

This fork attempts to get TextMate support for Code App, an iPad IDE. Currently, the fork does the followings.
- Adding most languages from VS Code Extensions
- Adding `vs-light-plus` theme
- Workaround for switching themes
- Expose editor to browser window
- Output `monaco-textmate.bundle` to be used within the app

## Build `monaco-textmate.bundle`
- `yarn install`
- `yarn build`
- Copy the bundle to the app directory
