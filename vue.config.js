module.exports = {
  // Disable filename hashing so we can refer directly to built files in the manifest
  filenameHashing: false,
  // Keep the extension payload smaller by disabling production sourcemaps
  productionSourceMap: false,
  pages: {
    'content-script': 'src/content-script.js',
    'background-script': 'src/background-script.js',
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

    // Allow for importing svg files as Vue components
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear();
    svgRule
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader');
  },
};
