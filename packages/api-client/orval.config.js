module.exports = {
  backendApi: {
    input: `${process.env.NODE_ENV === "production" ? "https://server-production-6859b.up.railway.app" : "http://localhost:4000"}/api-docs/json`,
    output: {
      workspace: ".",
      target: "src/api/index.ts",
      schemas: "src/model",
      mock: true,
      override: {
        mutator: {
          path: "./src/api/mutator/use-custom-instance.ts",
          name: "useCustomInstance",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
};
