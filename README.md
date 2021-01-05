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

---

## About the Fork

This fork attempts to get TextMate support for Code App, an iPad IDE. Currently, the fork does the followings.
- Adding most languages from VS Code Extensions
- Adding `vs-light-plus` theme
- Workaround for switching themes
- Expose editor to browser window
- Output `monaco-textmate.bundle` to be used within the app

### Build for iOS App
- `yarn install`
- `yarn build`
- Copy `monaco-textmate.bundle` to your app directory

### Integrating the editor in iOS
- Host the files with a HTTP server, for example [GCDWebServer](https://github.com/swisspol/GCDWebServer):
```swift
let webServer = GCDWebServer()
webServer.addGETHandler(forBasePath: "/", directoryPath: Bundle.main.path(forResource: "monaco-textmate", ofType: "bundle")!, indexFilename: "index.html", cacheAge: 10, allowRangeRequests: true)
```
- Load it with a `WKWebView`
```swift
let webView = WKWebView()

if let address = webServer.serverURL {
       let request = URLRequest(url: address)
       webView.load(request)
   }
 ```
