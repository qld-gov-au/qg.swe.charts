# Contributing

## Important notes
Please don't edit files in the `dist` subdirectory as they are generated via Grunt.
You'll find source code in the `src` subdirectory!

### Code style
Regarding code style like indentation and whitespace, **follow the conventions you see used in the source already.**
Learn more at [idiomatic.js](https://github.com/rwaldron/idiomatic.js/)

## Modifying the code
First, ensure that you have the latest [Node.js](http://nodejs.org/), [npm](http://npmjs.org/) and [bower](http://bower.io/) installed.

Test that Grunt's CLI is installed by running `grunt --version`.  If the command isn't found, run `npm install -g grunt-cli`.
For more information about installing Grunt, see the [getting started guide](http://gruntjs.com/getting-started).

1. Fork and clone the repo.
2. Run `npm install` to install all development dependencies (including Grunt).
3. Run `bower install` to install all dependencies.
4. Run `grunt` to build this project.

Assuming that you don't see any red, you're ready to go. Just be sure to run `grunt` after making any changes, to ensure that nothing is broken.
Alternatively, you can run `grunt watch` to monitor, test and recompile as you make changes.

## Submitting pull requests

Follow the [github flow](https://guides.github.com/introduction/flow/index.html) process.

1. Create a new branch, please don't work in your `master` branch directly.
2. Add failing tests for the change you want to make. Run `grunt` to see the tests fail.
3. Fix stuff.
4. Run `grunt` to see if the tests pass. Repeat steps 2-4 until done.
5. Open `test/*.html` unit test file(s) in actual browser to ensure tests pass everywhere.
6. Update the documentation to reflect any changes.
7. Push to your fork and submit a pull request.

