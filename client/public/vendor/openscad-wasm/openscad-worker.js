// Web Worker for compiling OpenSCAD code to STL via WASM
// Adapted from CADAM project (https://github.com/Adam-CAD/CADAM)
// This file lives in public/ so Vite does not bundle it as an ES module.

self.onmessage = async function(event) {
  var data = event.data;
  var id = data.id;
  var code = data.code;
  var params = data.params || [];

  if (data.type !== 'compile') {
    self.postMessage({ id: id, type: data.type, error: 'Unknown message type', log: { stdOut: [], stdErr: [] }, duration: 0 });
    return;
  }

  var start = performance.now();

  try {
    // Load the OpenSCAD WASM module if not yet loaded
    if (!self.OpenSCAD) {
      importScripts('/vendor/openscad-wasm/openscad.js');
    }

    var stdOut = [];
    var stdErr = [];

    // Create a fresh WASM instance each time (reuse has known bugs)
    var instance = await self.OpenSCAD({
      noInitialRun: true,
      locateFile: function(path) { return '/vendor/openscad-wasm/' + path; },
      print: function(text) { stdOut.push(text); },
      printErr: function(text) { stdErr.push(text); },
    });

    // Write the OpenSCAD code to the virtual filesystem
    instance.FS.writeFile('/input.scad', code);

    // Build CLI arguments
    var args = [
      '/input.scad',
      '-o', '/output.stl',
      '--export-format=binstl',
      '--enable=manifold',
      '--enable=fast-csg',
      '--enable=lazy-union',
    ];

    // Add parameter overrides as -D flags
    for (var i = 0; i < params.length; i++) {
      var p = params[i];
      var serialized;
      if (typeof p.value === 'string') {
        serialized = '"' + p.value + '"';
      } else {
        serialized = String(p.value);
      }
      args.push('-D', p.name + '=' + serialized);
    }

    var exitCode = instance.callMain(args);
    var duration = performance.now() - start;

    // Filter out harmless warnings from stderr
    var filteredStdErr = stdErr.filter(function(line) {
      return line.indexOf('Could not initialize localization') === -1;
    });

    if (exitCode !== 0) {
      self.postMessage({
        id: id,
        type: 'compile',
        error: filteredStdErr.join('\n') || ('OpenSCAD exited with code ' + exitCode),
        log: { stdOut: stdOut, stdErr: filteredStdErr },
        duration: duration,
      });
      return;
    }

    // Read the output STL file
    var output = instance.FS.readFile('/output.stl', { encoding: 'binary' });

    self.postMessage(
      { id: id, type: 'compile', output: output, log: { stdOut: stdOut, stdErr: filteredStdErr }, duration: duration },
      [output.buffer]
    );
  } catch (err) {
    var duration2 = performance.now() - start;
    self.postMessage({
      id: id,
      type: 'compile',
      error: (err && err.message) || 'Compilation failed',
      log: { stdOut: [], stdErr: [(err && err.message) || 'Unknown error'] },
      duration: duration2,
    });
  }
};
