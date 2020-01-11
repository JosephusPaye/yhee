module.exports = {
  // Disable filename hashing so we can refer directly to built files in the manifest
  filenameHashing: false,
  pages: {
    content: 'src/content.js',
    popup: {
      entry: 'src/popup.js',
      template: 'public/index.html',
      filename: 'popup.html',
      title: 'Yhee',
    },
    dashboard: {
      entry: 'src/dashboard.js',
      template: 'public/index.html',
      filename: 'dashboard.html',
      title: 'Yhee Dashboard',
    },
  },
  chainWebpack: config => {
    // Disable chunks so all files include the own dependencies, otherwise will have
    // to load vendor, common, AND content files to inject the content script)
    config.optimization.splitChunks(false);
  },
};
