module.exports = ({context}) => {
    const test = `
id = "projectriff/node-function"
version = "0.6.2"
addr = "gcr.io/projectriff/node-function@sha256:9d88250dfd77dbf5a535f1358c6a05dc2c0d3a22defbdcd72bb8f5e24b84e21d"
`

    let body = context.payload.issue.body
    body = body.replace(/\r?\n|\r/, "");

    let toml = require('toml');
    let data = toml.parse(body);
    return body;
  }
