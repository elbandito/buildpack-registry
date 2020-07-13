const toml = require('toml');

const testIssue = `
id = "projectriff/node-function"
version = "0.6.2"
addr = "gcr.io/projectriff/node-function@sha256:9d88250dfd77dbf5a535f1358c6a05dc2c0d3a22defbdcd72bb8f5e24b84e21d"
`

function validateIssue({context}) {
    if (context.payload.issue.title === "") {
        return new Error("issue title is missing")
    }

    if (!context.payload.issue.title.includes('ADD')) {
        return new Error("issue should contain ADD")
    }

    const cleanBody = (context.payload.issue.body).replace(/\r?\n|\r/, "")
    let tomlData
    try {
        tomlData = toml.parse(cleanBody)
    } catch (err) {
        return new Error("issue with TOML: " + err.message)
    }

    return tomlData
}

module.exports = {
    validateIssue
}
