const Schema = require('validate')
const Toml = require('toml')

const bodySchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    version: {
        type: String,
        match: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
        required: true
    },
    addr: {
        type: String,
        match: /[\w][\w.-]{0,127}@sha256:[A-Fa-f0-9]{64}/, // TODO: make this a stronger regex
        required: true
    },
})

function validateIssue(context) {
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

async function retriveOwners(context, github, env) {
    const buildpackInfo = JSON.parse(env.BUILDPACK)
    let registryOwners = ''
    try {
        const {data} = await github.repos.getContent({
            owner: env.GITHUB_OWNER,
            path: `v1/${buildpackInfo.ns}.json`,
            repo: env.NAMESPACE_REPO
        })
        const buff = new Buffer.from(data.content, 'base64')
        registryOwners = buff.toString('utf-8')

    } catch (error) {
        if (error.status && error.status === 404) {
            console.error('Creating file since it does not exist')
            const content = {
                owners: [
                    {
                        id: context.payload.sender.id,
                        type: 'github_user'
                    }
                ]
            };
            const buff = Buffer.from(JSON.stringify(content), 'utf-8');
            registryOwners = buff.toString('utf-8')

            await github.repos.createOrUpdateFile({
                owner: env.GITHUB_OWNER,
                repo: env.NAMESPACE_REPO,
                path: `v1/${buildpackInfo.ns}.json`,
                message: 'initial commit',
                content: buff.toString('base64'),
                committer: {
                    name: env.GITHUB_OWNER,
                    email: 'longoria.public@gmail.com'
                },
                author: {
                    name: env.GITHUB_OWNER,
                    email: 'longoria.public@gmail.com'
                }
            })
        } else {
            throw error
        }
    }

    return registryOwners
}

module.exports = {
    validateIssue,
    retriveOwners
}
