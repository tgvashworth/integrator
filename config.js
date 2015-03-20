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
    "immutable": "npm:immutable@3.6.4"
  }
});

