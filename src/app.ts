import type {LanguageId} from './register';
import type {ScopeName, TextMateGrammar} from './providers';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {createOnigScanner, createOnigString, loadWASM} from 'vscode-oniguruma';
import {SimpleLanguageInfoProvider} from './providers';
import {registerLanguages} from './register';
import {rehydrateRegexps} from './configuration';
import VsCodeDarkTheme from './vs-dark-plus-theme';
import VsCodeLightTheme from './vs-light-plus-theme';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';
// import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/html/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/css/monaco.contribution.js';
import {emmetHTML, emmetCSS, emmetJSX} from 'emmet-monaco-es';
import {BUILT_IN_GRAMMARS, BUILT_IN_LANGUAGE_DEFINITIONS, DemoScopeNameInfo} from './constants';
import {fetchWrapper, loadVSCodeOnigurumWASM} from './utilities';

(window as any).main = main;
(window as any).changeTheme = changeTheme;
(window as any).monaco = monaco;
(window as any).setTheme = setTheme;

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
  },
};

emmetHTML();
emmetCSS();
emmetJSX();
main('json', 'vs-dark');

let provider: SimpleLanguageInfoProvider | undefined;

function setTheme(name: string, theme: any) {
  if (!provider) return;

  monaco.editor.defineTheme(name, {
    base: theme.type == 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      {
        foreground: theme.colors['editor.foreground'],
        background: theme.colors['editor.background'],
        token: '',
      },
    ],
    colors: theme.colors,
  });

  const themeData = {
    name: theme.name,
    settings: {
      ...theme.tokenColors,
      settings: {
        foreground: theme.colors['editor.foreground'],
        background: theme.colors['editor.background'],
      },
    },
  };

  provider.registry.setTheme(themeData);
  provider.injectCSS();

  monaco.editor.setTheme(name);
}

function changeTheme(theme: string) {
  if (theme == 'vs-dark') {
    monaco.editor.setTheme('vs-dark');
    provider!.registry.setTheme(VsCodeDarkTheme);
    provider!.injectCSS();
  } else if (theme == 'vs') {
    monaco.editor.setTheme('vs');
    provider!.registry.setTheme(VsCodeLightTheme);
    provider!.injectCSS();
  }
}

async function main(
  language: LanguageId,
  theme: string,
  extraLanguages: monaco.languages.ILanguageExtensionPoint[] = [],
  extraGrammars: {[scopeName: string]: DemoScopeNameInfo} = {},
  fetchExtraGrammar?: (scopeName: ScopeName) => Promise<TextMateGrammar>,
  fetchExtraConfiguration?: (
    scopeName: ScopeName,
  ) => Promise<monaco.languages.LanguageConfiguration>,
) {
  const data: ArrayBuffer | Response = await loadVSCodeOnigurumWASM();
  await loadWASM(data);

  const languages: monaco.languages.ILanguageExtensionPoint[] = [
    ...BUILT_IN_LANGUAGE_DEFINITIONS,
    ...extraLanguages,
  ];
  const grammars: {[scopeName: string]: DemoScopeNameInfo} = {
    ...BUILT_IN_GRAMMARS,
    ...extraGrammars,
  };

  const fetchGrammar = async (scopeName: ScopeName): Promise<TextMateGrammar> => {
    if (scopeName in extraGrammars && fetchExtraGrammar) {
      return fetchExtraGrammar(scopeName);
    }

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
    if (language in extraLanguages && fetchExtraConfiguration) {
      return fetchExtraConfiguration(language);
    }

    const uri = `/configurations/${language}.json`;
    const response = await fetchWrapper(uri);
    const rawConfiguration = await response.text();
    return rehydrateRegexps(rawConfiguration);
  };

  const onigLib = Promise.resolve({
    createOnigScanner,
    createOnigString,
  });

  provider = new SimpleLanguageInfoProvider({
    grammars,
    fetchGrammar,
    configurations: languages.map((language) => language.id),
    fetchConfiguration,
    theme: theme == 'vs-dark' ? VsCodeDarkTheme : VsCodeLightTheme,
    onigLib,
    monaco,
  });
  registerLanguages(
    languages,
    (language: LanguageId) => provider!.fetchLanguageInfo(language),
    monaco,
  );

  const value = '';
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
      ambiguousCharacters: false,
    },
  });

  (window as any).editor = mainEditor;
  (window as any).applyListeners((window as any).editor);
  provider.injectCSS();
}
