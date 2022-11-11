// For WKWebView on iOS, we need to load the wasm binary from the bundle
export function fetchWrapper(
  input: RequestInfo,
  init?: RequestInit | undefined,
): Promise<Response> {
  if (navigator.userAgent.indexOf('CodeApp') !== -1 && typeof input === 'string') {
    const href = window.location.href;
    const base = href.substr(0, href.lastIndexOf('/') + 1);
    const path = base + input;
    return fetch(path, init);
  } else {
    return fetch(input, init);
  }
}

// Taken from https://github.com/microsoft/vscode/blob/829230a5a83768a3494ebbc61144e7cde9105c73/src/vs/workbench/services/textMate/browser/textMateService.ts#L33-L40
export async function loadVSCodeOnigurumWASM(): Promise<Response | ArrayBuffer> {
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
