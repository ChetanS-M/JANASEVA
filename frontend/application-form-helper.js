(function () {
  function normalizeSelectValue(value) {
    if (typeof value !== 'string') return value;
    return value.includes('|') ? value.split('|').pop().trim() : value;
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error('Unable to read uploaded file: ' + (file && file.name ? file.name : 'unknown')));
      };
      reader.readAsDataURL(file);
    });
  }

  async function serializeApplicationForm(form) {
    const data = {};
    const elements = Array.from(form.elements || []);

    for (const el of elements) {
      if (!el.name || el.disabled || el.type === 'button' || el.type === 'submit') continue;

      if (el.type === 'checkbox') {
        data[el.name] = !!el.checked;
        continue;
      }

      if (el.type === 'file') {
        const files = Array.from(el.files || []);
        if (!files.length) continue;

        const serializedFiles = await Promise.all(files.map(async function (file) {
          return {
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size || 0,
            data_url: await readFileAsDataUrl(file)
          };
        }));

        const existingValue = data[el.name];
        const documentPayload = existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)
          ? existingValue
          : {};

        if (typeof existingValue === 'string' && existingValue.trim()) {
          documentPayload.label = existingValue.trim();
        }

        documentPayload.files = serializedFiles;
        data[el.name] = documentPayload;
        continue;
      }

      data[el.name] = normalizeSelectValue(el.value);
    }

    Object.keys(data).forEach(function (key) {
      const value = data[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        data[key] = JSON.stringify(value);
      }
    });

    return data;
  }

  window.serializeApplicationForm = serializeApplicationForm;
})();
