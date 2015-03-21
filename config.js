System.config({
  "baseURL": "build",
  "transpiler": "babel",
  "paths": {
    "*": "*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});

System.config({
  "map": {
    "fnkit": "npm:fnkit@1.0.0",
    "immutable": "npm:immutable@3.6.4"
  }
});

