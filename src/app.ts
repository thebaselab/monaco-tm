import type {LanguageId} from './register';
import type {ScopeName, TextMateGrammar, ScopeNameInfo} from './providers';

// Recall we are using MonacoWebpackPlugin. According to the
// monaco-editor-webpack-plugin docs, we must use:
//
// import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
//
// instead of
//
// import * as monaco from 'monaco-editor';
//
// because we are shipping only a subset of the languages.
// import * as monaco from 'monaco-editor';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {createOnigScanner, createOnigString, loadWASM} from 'vscode-oniguruma';
import {SimpleLanguageInfoProvider} from './providers';
import {registerLanguages} from './register';
import {rehydrateRegexps} from './configuration';
import VsCodeDarkTheme from './vs-dark-plus-theme';
import VsCodeLightTheme from './vs-light-plus-theme';
import {languagesDefinitions} from './languages';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';
// import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/html/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/css/monaco.contribution.js';
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";

MonacoEnvironment = {
	getWorkerUrl: function (moduleId: any, label: String) {
		// if (label === 'json') {
		// 	return './json.worker.bundle.js';
		// }
		if (label === 'css' || label === 'scss' || label === 'less') {
			return './css.worker.bundle.js';
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return './html.worker.bundle.js';
		}
		if (label === 'typescript' || label === 'javascript') {
			return './ts.worker.bundle.js';
		}
		return './editor.worker.bundle.js';
	}
};

interface DemoScopeNameInfo extends ScopeNameInfo {
  path: string;
}

(window as any).main = main;
(window as any).changeTheme = changeTheme;
(window as any).monaco = monaco;
(window as any).setTheme = setTheme;

emmetHTML();
emmetCSS();
emmetJSX();
main('json', 'vs-dark');

let provider: SimpleLanguageInfoProvider | undefined;

async function setTheme(name: string, theme: any){
  monaco.editor.defineTheme(name, {
    base: theme.type == 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [{ foreground: theme.colors['editor.foreground'] ,background: theme.colors['editor.background'], token: "" }],
    colors: theme.colors
  });
  monaco.editor.setTheme(name);

  let themeData: any = {};

  themeData.name = theme.name;
  themeData.settings = theme.tokenColors;
  themeData.settings.push({
    "settings": {
      "foreground": theme.colors['editor.foreground'],
      "background": theme.colors['editor.background'],
    }
  });

  provider!.registry.setTheme(themeData)
  provider!.injectCSS()
}

async function changeTheme(theme:string) {
  if (theme == "vs-dark"){
    monaco.editor.setTheme("vs-dark")
    provider!.registry.setTheme(VsCodeDarkTheme)
    provider!.injectCSS()
  }else if (theme == "vs"){
    monaco.editor.setTheme("vs")
    provider!.registry.setTheme(VsCodeLightTheme)
    provider!.injectCSS()
  }
  
}

async function main(language: LanguageId, theme: string) {
  // In this demo, the following values are hardcoded to support Python using
  // the VS Code Dark+ theme. Currently, end users are responsible for
  // extracting the data from the relevant VS Code extensions themselves to
  // leverage other TextMate grammars or themes. Scripts may be provided to
  // facilitate this in the future.
  //
  // Note that adding a new TextMate grammar entails the following:
  // - adding an entry in the languages array
  // - adding an entry in the grammars map
  // - making the TextMate file available in the grammars/ folder
  // - making the monaco.languages.LanguageConfiguration available in the
  //   configurations/ folder.
  //
  // You likely also want to add an entry in getSampleCodeForLanguage() and
  // change the call to main() above to pass your LanguageId.
  const languages: monaco.languages.ILanguageExtensionPoint[] = languagesDefinitions;
  const grammars: {[scopeName: string]: DemoScopeNameInfo} = {
    'scope.terraform': {
      language: 'terraform',
      path: 'terraform.tmGrammar.json',
    },
    'source.vue': {
      language: 'vue',
      path: 'vue-generated.json',
    },
    'source.matlab': {
      language: 'matlab',
      path: 'matlab.tmLanguage.json',
    },
    'source.dart': {
      language: 'dart',
      path: 'dart.tmLanguage.json',
    },
    'source.fortran': {
      language: 'fortran',
      path: 'fortran.tmLanguage.json',
    },
    'source.fortran.modern': {
      language: 'fortran-modern',
      path: 'fortran-modern.tmLanguage.json',
    },
    'source.yaml': {
      language: 'yaml',
      path: 'yaml.tmLanguage.json',
    },
    'text.xml': {
      language: 'xml',
      path: 'xml.tmLanguage.json',
    },
    'text.xml.xsl': {
      language: 'xsl',
      path: 'xsl.tmLanguage.json',
    },
    'source.asp.vb.net': {
      language: 'vb',
      path: 'asp-vb-net.tmLanguage.json',
    },
    'source.swift': {
      language: 'swift',
      path: 'swift.tmLanguage.json',
    },
    'source.shell': {
      language: 'shellscript',
      path: 'shell-unix-bash.tmLanguage.json',
    },
    'source.shaderlab': {
      language: 'shaderlab',
      path: 'shaderlab.tmLanguage.json',
    },
    'source.sql': {
      language: 'sql',
      path: 'sql.tmLanguage.json',
    },
    'source.css.scss': {
      language: 'scss',
      path: 'scss.tmLanguage.json',
    },
    'source.rust': {
      language: 'rust',
      path: 'rust.tmLanguage.json',
    },
    'source.ruby': {
      language: 'ruby',
      path: 'ruby.tmLanguage.json',
    },
    'text.html.cshtml': {
      language: 'razor',
      path: 'cshtml.tmLanguage.json',
    },
    'source.r': {
      language: 'r',
      path: 'r.tmLanguage.json',
    },
    'text.pug': {
      language: 'jade',
      path: 'pug.tmLanguage.json',
    },
    'source.powershell': {
      language: 'powershell',
      path: 'powershell.tmLanguage.json',
    },
    'source.perl': {
      language: 'perl',
      path: 'perl.tmLanguage.json',
    },
    'source.perl.6': {
      language: 'perl6',
      path: 'perl6.tmLanguage.json',
    },
    'text.html.php': {
      language: 'php',
      path: 'htmlphp.tmLanguage.json',
    },
    'source.php': {
      language: 'php',
      path: 'php.tmLanguage.json',
    },
    'source.objc': {
      language: 'objective-c',
      path: 'objective-c.tmLanguage.json',
    },
    'source.objcpp': {
      language: 'objective-cpp',
      path: 'objective-c++.tmLanguage.json',
    },
    'text.html.markdown': {
      language: 'markdown',
      path: 'markdown.tmLanguage.json',
    },
    'source.makefile': {
      language: 'makefile',
      path: 'make.tmLanguage.json',
    },
    'source.lua': {
      language: 'lua',
      path: 'lua.tmLanguage.json',
    },
    'text.log': {
      language: 'log',
      path: 'log.tmLanguage.json',
    },
    'source.css.less': {
      language: 'less',
      path: 'less.tmLanguage.json',
    },
    'source.java': {
      language: 'java',
      path: 'java.tmLanguage.json',
    },
    'source.json': {
      language: 'json',
      path: 'JSON.tmLanguage.json',
    },
    'source.json.comments': {
      language: 'jsonc',
      path: 'JSONC.tmLanguage.json',
    },
    'source.ini': {
      language: 'properties',
      path: 'ini.tmLanguage.json',
    },
    'text.html.handlebars': {
      language: 'handlebars',
      path: 'handlebars.tmLanguage.json',
    },
    'source.hlsl': {
      language: 'hlsl',
      path: 'hlsl.tmLanguage.json',
    },
    'source.groovy': {
      language: 'groovy',
      path: 'groovy.tmLanguage.json',
    },
    'source.go': {
      language: 'go',
      path: 'go.tmLanguage.json',
    },
    'source.fsharp': {
      language: 'fsharp',
      path: 'fsharp.tmLanguage.json',
    },
    'source.dockerfile': {
      language: 'dockerfile',
      path: 'docker.tmLanguage.json',
    },
    'source.coffee': {
      language: 'coffeescript',
      path: 'coffeescript.tmLanguage.json',
    },
    'source.python': {
      language: 'python',
      path: 'MagicPython.tmLanguage.json',
    },
    'source.c': {
      language: 'c',
      path: 'c.tmLanguage.json',
    },
    'source.cpp': {
      language: 'cpp',
      path: 'cpp.tmLanguage.json',
    },
    'source.cs': {
      language: 'csharp',
      path: 'csharp.tmLanguage.json',
    },
    'source.clojure': {
      language: 'clojure',
      path: 'clojure.tmLanguage.json'
    },
    'text.html.basic': {
      language: 'html',
      path: 'html.tmLanguage.json',
    },
    'source.js.jsx': {
      language: 'javascriptreact',
      path: 'JavaScriptReact.tmLanguage.json',
    },
    'source.js': {
      language: 'javascript',
      path: 'JavaScript.tmLanguage.json',
    },
    'source.css': {
      language: 'css',
      path: 'css.tmLanguage.json',
    },
    'source.ts': {
      language: 'typescript',
      path: 'TypeScript.tmLanguage.json',
    },
    'source.tsx': {
      language: 'typescriptreact',
      path: 'TypeScriptReact.tmLanguage.json',
    },
    'documentation.injection.js.jsx': {
      language: 'jsonc',
      path: 'jsonc.js.injection.tmLanguage.json'
    },
    'documentation.injection.ts.tsx': {
      language: 'jsonc',
      path: 'jsonc.ts.injection.tmLanguage.json'
    },
    'source.batchfile': {
      language: 'bat',
      path: 'batchfile.tmLanguage.json'
    }
  };

  const fetchGrammar = async (scopeName: ScopeName): Promise<TextMateGrammar> => {
    const {path} = grammars[scopeName];
    const uri = `/grammars/${path}`;
    const response = await fetchWrapper(uri);
    const grammar = await response.text();
    const type = path.endsWith('.json') ? 'json' : 'plist';
    return {type, grammar};
  };

  const fetchConfiguration = async (
    language: LanguageId,
  ): Promise<monaco.languages.LanguageConfiguration> => {
    const uri = `/configurations/${language}.json`;
    const response = await fetchWrapper(uri);
    const rawConfiguration = await response.text();
    return rehydrateRegexps(rawConfiguration);
  };
  const data: ArrayBuffer | Response = await loadVSCodeOnigurumWASM();
  loadWASM(data); 
  const onigLib = Promise.resolve({
    createOnigScanner,
    createOnigString,
  });

  provider = new SimpleLanguageInfoProvider({
    grammars,
    fetchGrammar,
    configurations: languages.map((language) => language.id),
    fetchConfiguration,
    // theme: VsCodeLightTheme,
    theme: ((theme == "vs-dark") ? VsCodeDarkTheme : VsCodeLightTheme),
    onigLib,
    monaco,
  });
  registerLanguages(
    languages,
    (language: LanguageId) => provider!.fetchLanguageInfo(language),
    monaco,
  );

  const value = getSampleCodeForLanguage(language);
  const id = 'container';
  const element = document.getElementById(id);
  if (element == null) {
    throw Error(`could not find element #${id}`);
  }

  const mainEditor = monaco.editor.create(element, {
    value: value,
    language: language,
    theme: theme,
    minimap: {
      enabled: true,
    },
    automaticLayout: true, 
    glyphMargin: false,
    lineNumbersMinChars: 3, 
    contextmenu: true,
    unicodeHighlight: {
      ambiguousCharacters: false
    }
  });

  (window as any).editor = mainEditor;
  (window as any).applyListeners((window as any).editor);
  provider.injectCSS();
}

// For WKWebView on iOS, we need to load the wasm binary from the bundle
function fetchWrapper(input: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
  if(navigator.userAgent.indexOf("CodeApp") !== -1 && typeof input === 'string') {
    const href = window.location.href;
    const base = href.substr(0, href.lastIndexOf('/') + 1);
    const path = base + input;
    return fetch(path, init);
  }else{
    return fetch(input, init);
  }
}

// Taken from https://github.com/microsoft/vscode/blob/829230a5a83768a3494ebbc61144e7cde9105c73/src/vs/workbench/services/textMate/browser/textMateService.ts#L33-L40
async function loadVSCodeOnigurumWASM(): Promise<Response | ArrayBuffer> {
  const response = await fetchWrapper('/node_modules/vscode-oniguruma/release/onig.wasm');
  const contentType = response.headers.get('content-type');
  if (contentType === 'application/wasm') {
    return response;
  }

  // Using the response directly only works if the server sets the MIME type 'application/wasm'.
  // Otherwise, a TypeError is thrown when using the streaming compiler.
  // We therefore use the non-streaming compiler :(.
  return await response.arrayBuffer();
}

function getSampleCodeForLanguage(language: LanguageId): string {
  if (language === 'json') {
    return ``;
  }

  if (language === 'go') {
    return `\
import "strings"
import "fmt"

// Returns the first index of the target string 't', or
// -1 if no match is found.
func Index(vs []string, t string) int {
    for i, v := range vs {
        if v == t {
            return i
        }
    }
    return -1
}
`;
  }

  if (language === 'fsharp') {
    return `\
(* Sample F# application *)
[<EntryPoint>]
let main argv = 
    printfn "%A" argv
    System.Console.WriteLine("Hello from F#")
    0 // return an integer exit code

//-------------------------------------------------------- 
`;
  }

  if (language === 'dockerfile') {
    return `\
FROM mono:3.12

ENV KRE_FEED https://www.myget.org/F/aspnetvnext/api/v2
ENV KRE_USER_HOME /opt/kre

RUN apt-get -qq update && apt-get -qqy install unzip 

ONBUILD RUN curl -sSL https://raw.githubusercontent.com/aspnet/Home/dev/kvminstall.sh | sh
ONBUILD RUN bash -c "source $KRE_USER_HOME/kvm/kvm.sh \
    && kvm install latest -a default \
    && kvm alias default | xargs -i ln -s $KRE_USER_HOME/packages/{} $KRE_USER_HOME/packages/default"
`;
  }

  if (language === 'coffeescript') {
    return `\
    """
    A CoffeeScript sample.
    """
    
    class Vehicle
      constructor: (@name) =>
      
      drive: () =>
        alert "Conducting #{@name}"
    
    class Car extends Vehicle
      drive: () =>
        alert "Driving #{@name}"
    
    c = new Car "Brandie"
    
    while notAtDestination()
      c.drive()
    
    raceVehicles = (new Car for i in [1..100])
    
    startRace = (vehicles) -> [vehicle.drive() for vehicle in vehicles]
    
    fancyRegExp = ///
      (\d+)	# numbers
      (\w*)	# letters
      $		# the end
    ///
`;
  }

  if (language === 'clojure') {
    return `\
(ns game-of-life
  "Conway's Game of Life, based on the work of
  Christophe Grand (http://clj-me.cgrand.net/2011/08/19/conways-game-of-life)
  and Laurent Petit (https://gist.github.com/1200343).")

;;; Core game of life's algorithm functions

(defn neighbors
  "Given a cell's coordinates '[x y]', returns the coordinates of its
  neighbors."
  [[x y]]
  (for [dx [-1 0 1]
        dy (if (zero? dx)
            [-1 1]
            [-1 0 1])]
    [(+ dx x) (+ dy y)]))
`;
  }


  if (language === 'python') {
    return `\
import foo

async def bar(): string:
  f = await foo()
  f_string = f"Hooray {f}! format strings are not supported in current Monarch grammar"
  return foo_string
`;
  }

  if (language === 'cpp' || language === 'c') {
    return `\
#include <iostream>
using namespace std;

int main()
{
    int n, sum = 0;

    cout << "Enter a positive integer: ";
    cin >> n;

    for (int i = 1; i <= n; ++i) {
        sum += i;
    }

    cout << "Sum = " << sum;
    return 0;
}
`;
  }

  if (language === 'html') {
    return `\
<html>
  <style>
    a:link {
    color: gray;
    }
    a:visited {
    color: green;
    }
    a:hover {
    color: purple;
    }
    a:active {
    color: teal;
    }
  </style>
  <body>
    <h1>Hello, World</h1>
  </body>
  <script>
    console.log("hi")
  <script>
</html>
`;
  }

  if (language === 'javascript') {
    return `\
console.log(123);
document.getElementById("123")
`;
  }

  if (language === 'javascriptreact') {
    return `\
function formatName(user) {
  return user.firstName+ ' ' + user.lastName;
}

const user = {
  firstName: 'Harper',
  lastName: 'Perez'
};

const element = (
  <h1>
    Hello, {formatName(user)}!
  </h1>
);

ReactDOM.render(
  element,
  document.getElementById('root')
);
`;
  }

  if (language === 'css') {
    return `\
a:link {
color: gray;
}
a:visited {
color: green;
}
a:hover {
color: purple;
}
a:active {
color: teal;
}
`;
  }

  if (language === 'php') {
    return `\
<!DOCTYPE html>
<html>
<body>

<h1>My first PHP page</h1>

<?php
echo "Hello World!";
?>

</body>
</html>
    `
  }

  if (language === 'bat') {
    return `\
rem *******Begin Comment**************
rem This program starts the superapp batch program on the network,
rem directs the output to a file, and displays the file
rem in Notepad.
rem *******End Comment**************
@echo off
if exist C:\output.txt goto EMPTYEXISTS
setlocal
  path=g:\programs\superapp;%path%
  call superapp>C:\output.txt
endlocal
:EMPTYEXISTS
start notepad c:\output.txt
`;
  }

  if (language === 'csharp') {
    return `\
/*
* C# Program to Display All the Prime Numbers Between 1 to 100
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace VS
{
  class Program
  {
    static void Main(string[] args)
        {
      bool isPrime = true;
      Console.WriteLine("Prime Numbers : ");
      for (int i = 2; i <= 100; i++)
      {
        for (int j = 2; j <= 100; j++)
        {
          if (i != j && i % j == 0)
          {
            isPrime = false;
            break;
          }
        }
        
        if (isPrime)
        {
          Console.Write("\t" +i);
        }
        isPrime = true;
      }
      Console.ReadKey();
    }
  }
}
    
`;
  }

  if (language === 'typescript') {
    return `\
/* Game of Life
* Implemented in TypeScript
* To learn more about TypeScript, please visit http://www.typescriptlang.org/
*/

namespace Conway {

  export class Cell {
    public row: number;
    public col: number;
    public live: boolean;

    constructor(row: number, col: number, live: boolean) {
      this.row = row;
      this.col = col;
      this.live = live;
    }
  }

  export class GameOfLife {
    private gridSize: number;
    private canvasSize: number;
    private lineColor: string;
    private liveColor: string;
    private deadColor: string;
    private initialLifeProbability: number;
    private animationRate: number;
    private cellSize: number;
    private context: CanvasRenderingContext2D;
    private world;


    constructor() {
      this.gridSize = 50;
      this.canvasSize = 600;
      this.lineColor = '#cdcdcd';
      this.liveColor = '#666';
      this.deadColor = '#eee';
      this.initialLifeProbability = 0.5;
      this.animationRate = 60;
      this.cellSize = 0;
      this.world = this.createWorld();
      this.circleOfLife();
    }

    public travelWorld(callback) {
      var result = [];
      for(var row = 0; row < this.gridSize; row++) {
        var rowData = [];
        for(var col = 0; col < this.gridSize; col++) {
          rowData.push(callback(new Cell(row, col, false)));
        }
        result.push(rowData);
      }
      return result;
    }

    public draw(cell : Cell) {
      if(this.context == null) this.context = this.createDrawingContext();
      if(this.cellSize == 0) this.cellSize = this.canvasSize/this.gridSize;

      this.context.strokeStyle = this.lineColor;
      this.context.strokeRect(cell.row * this.cellSize, cell.col*this.cellSize, this.cellSize, this.cellSize);
      this.context.fillStyle = cell.live ? this.liveColor : this.deadColor;
      this.context.fillRect(cell.row * this.cellSize, cell.col*this.cellSize, this.cellSize, this.cellSize);
    }

    public createDrawingContext() {
      var canvas = <HTMLCanvasElement> document.getElementById('conway-canvas');
      if(canvas == null) {
          canvas = document.createElement('canvas');
          canvas.id = 'conway-canvas';
          canvas.width = this.canvasSize;
          canvas.height = this.canvasSize;
          document.body.appendChild(canvas);
      }
      return canvas.getContext('2d');
    }
  }
}

var game = new Conway.GameOfLife();
   
`;
  }

  return ``
}
