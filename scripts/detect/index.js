const Schema = require('validate')
const Toml = require('toml')

const testIssue = `
id = "projectriff/node-function"
version = "0.6.2"
addr = "gcr.io/projectriff/node-function@sha256:9d88250dfd77dbf5a535f1358c6a05dc2c0d3a22defbdcd72bb8f5e24b84e21d"
`
const bodySchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    version: {
        type: String,
        required: true
    },
    addr: {
        type: String,
        match: /[\w][\w.-]{0,127}/,
        required: true
    },
})

function validateIssue({context}) {
    if (context.payload.issue.title === "") {
        throw new Error("issue title is missing")
    }
    if (!context.payload.issue.title.includes('ADD')) {
        throw new Error("issue should contain ADD")
    }

    let tomlData
    try {
        tomlData = Toml.parse(context.payload.issue.body)
    } catch (err) {
        throw new Error(`issue with TOML: ${err.message}`)
    }

    const errors = bodySchema.validate(tomlData)
    if (errors && errors.length > 0) {
        throw new Error(`invalid issue body: ${errors}`)
    }

    return {
        ns: tomlData.id.split("/")[0],
        name: tomlData.id.split("/")[1],
        version: tomlData.version,
        yanked: false,
        addr: tomlData.addr
    }
}

module.exports = {
    validateIssue
}
