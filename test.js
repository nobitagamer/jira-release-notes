'use strict'

var generator = require('./')
var prompt = require('prompt')

if (typeof process.env.JIRA_USERNAME === 'undefined') {
  var schema = {
    properties: {
      name: {
        description: 'Enter your Jira user name',
        required: true
      },
      password: {
        description: 'Enter your Jira password',
        hidden: true,
        replace: '*'
      }
    }
  }
  prompt.start()

  prompt.get(schema, (err, result) => {
    if (err) {
      console.error(err)
    }

    process.env['JIRA_USERNAME'] = result.name
    process.env['JIRA_PASSWORD'] = result.password

    generate()
  })
} else {
  generate()
}

function generate () {
  generator.generateReleaseNotes({
    // outputFile: 'ReleaseNotes.md',
    project: 'BCC E-Learning',
    prefix: 'BCCEL',
    version: 'v1.4.0-build.4'
  })
}
