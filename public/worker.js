
const fetchWithTimeout = async (resource, options) => {
  const { timeout = 8000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

const fetchPing = async () => {
  const startDate = Date.now();

  await fetchWithTimeout('https://ping.qlaffont.com', {
    method: 'GET',
    timeout: 999,
  });

  const endDate = Date.now();

  return (endDate - startDate);
};


const ping = async () => {
  try {
    const res = await fetchPing();
    postMessage([Date.now(), res]);
  } catch (error) {
    postMessage([Date.now(), 999]);
  }

  setTimeout(() => {
    ping();
  }, 1000);
}

ping()
