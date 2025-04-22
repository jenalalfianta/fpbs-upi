export const fixUrl = (url: string) => {
    // Deteksi apakah sedang di development
    const isDev = import.meta.env.DEV;
    return isDev ? url : `${url}.html`;
  };
  