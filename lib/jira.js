'use strict'

var fs = require('fs')
var path = require('path')
var util = require('util')

var _ = require('underscore')
var cons = require('consolidate')
var search = require('jira-search')

var template = 'markdown.ejs'
var tempalteType = 'underscore'

module.exports = (args, done) => {
  args.encoding = args.encoding || 'utf-8'
  args.template = args.template || path.resolve(__dirname, '../templates/' + path.basename(template, '.ejs') + '.ejs')

  if (args == null) {
    console.error('\nInput args is invalid!')
    process.exit(1)
  }

  if (!fs.existsSync(template)) {
    // Template name?
    if (template.match(/[a-z]+(\.ejs)?/)) {
      template = path.resolve(__dirname, '../templates/' + path.basename(template, '.ejs') + '.ejs')
    } else {
      console.error('\nUnable to locate template file ' + template)
      process.exit(1)
    }
  }

  search({
    serverRoot: 'https://webteam-jira.flexidata.vn', // the base URL for the JIRA server
    user: process.env.JIRA_USERNAME, // the user name
    pass: process.env.JIRA_PASSWORD, // the password
    jql: util.format('fixVersion="%s %s" ORDER BY fixVersion ASC', args.prefix, args.version), // the JQL
    fields: '*all', // the fields parameter for the JIRA search
    expand: 'changelog', // the expand parameter for the JIRA search
    maxResults: 50, // the maximum number of results for each request to JIRA, multiple requests will be made till all the matching issues have been collected
    onTotal: function (total) {
      // optionally initialise a progress bar or something
    },
    mapCallback: function (issue) {
      // This will be called for each issue matching the search.
      // Update a progress bar or something if you want here.
      // The return value from this function will be added
      // to the array returned by the promise.
      // If omitted the default behaviour is to add the whole issue
      return {
        id: issue.key,
        title: issue.fields.summary,
        link: issue.self,
        type: issue.fields.issuetype.name,
        note: issue.fields.customfield_11300
      }
    }
  }).then(function (issues) {
    // consume the collected issues array here
    var templateData = {
      name: args.project,
      prefix: args.prefix,
      version: args.version,
      notes: _.filter(issues, i => i.note != null),
      issueGroups: _.groupBy(issues, 'type')
    }

    // process.stdout.write(JSON.stringify(issues, null, '  '))

    cons[tempalteType](template, templateData).then(result => {
      var outputFile = args.outputFile
      if (outputFile == null) {
        console.warn('\nOutput file was not specified, write to console!\n')
        process.stdout.write(result)
      } else {
        var oldContent = ''
        if (fs.existsSync(outputFile)) {
          oldContent = fs.readFileSync(outputFile, args.encoding)
        }

        fs.writeFileSync(outputFile, result + oldContent, args.encoding)
        done()
      }
    }).done()
  }).done()
}
