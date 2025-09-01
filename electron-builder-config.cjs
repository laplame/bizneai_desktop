module.exports = {
  appId: "com.bizneai.pos",
  productName: "BizneAI POS",
  copyright: "Copyright © 2024 BizneAI Team",
  directories: {
    output: "release",
    buildResources: "build"
  },
  files: [
    "dist/**/*",
    "electron/**/*",
    "blockchain/**/*",
    "node_modules/**/*",
    "package.json",
    "!node_modules/.cache/**/*",
    "!node_modules/.vite/**/*",
    "!node_modules/.bin/**/*",
    "!node_modules/*/test/**/*",
    "!node_modules/*/tests/**/*",
    "!node_modules/*/docs/**/*",
    "!node_modules/*/examples/**/*"
  ],
  extraResources: [
    {
      from: "public",
      to: "public"
    },
    {
      from: "blockchain/luxaeBlockhain/data",
      to: "blockchain/data"
    }
  ],
  asar: true,
  asarUnpack: [
    "node_modules/call-bind-apply-helpers/**/*",
    "node_modules/call-bind/**/*",
    "node_modules/get-intrinsic/**/*",
    "node_modules/side-channel/**/*",
    "node_modules/dunder-proto/**/*",
    "node_modules/get-proto/**/*",
    "node_modules/better-sqlite3/**/*",
    "node_modules/sqlite3/**/*",
    "node_modules/express/**/*",
    "node_modules/qs/**/*",
    "node_modules/cloudinary/**/*",
    "node_modules/multer/**/*",
    "node_modules/cors/**/*",
    "node_modules/helmet/**/*",
    "node_modules/morgan/**/*",
    "node_modules/socket.io/**/*",
    "node_modules/ws/**/*",
    "node_modules/axios/**/*",
    "node_modules/stripe/**/*",
    "node_modules/zod/**/*",
    "node_modules/quagga/**/*",
    "node_modules/lucide-react/**/*",
    "node_modules/react-hot-toast/**/*",
    "node_modules/web3/**/*",
    "node_modules/ethereumjs-util/**/*",
    "node_modules/solc/**/*"
  ],
  nodeGypRebuild: false,
  buildDependenciesFromSource: false,
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      },
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    icon: "build/icon.ico",
    requestedExecutionLevel: "asInvoker"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "BizneAI POS"
  }
};
