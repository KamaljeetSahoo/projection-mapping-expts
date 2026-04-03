export function exportProject(shapes, name = 'projection-map') {
  const data = {
    version: 1,
    name,
    shapes,
    exportedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.projmap`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProject() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.projmap,.json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data.shapes || !Array.isArray(data.shapes)) {
            reject(new Error('Invalid projmap file'));
            return;
          }
          resolve(data.shapes);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
