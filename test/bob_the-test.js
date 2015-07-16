"use strict";
var projectBuilder = require("../projectBuilder");

var chai = require("chai");
var expect = chai.expect;

describe("projectBuilder", function() {
  describe("projectInit", function() {
    it("will prompt the user for a project name", function() {

    });
    it("will make new directory in CWD, with test and lib sub-directories", function() {

    });
    it("will copy the gulpfile.js, .gitignore, .jshintrc, and .jscsrc from ./resources/ to project root", function() {

    });
    it("will copy -test.js, renamed with project name, from ./resources/.bob_therc to test directory", function() {

    });
  });
  describe("devPackages", function() {
    it("will walk the user through the creation of a package.json", function() {

    });
    it("will populate the devDependencies field with those listed in ./resources/.bob_therc", function() {

    });
    it("will run npm install to install those devDependencies", function() {

    });
  });
});

