var fs = require("fs");
var exec = require("child_process").exec;
var prompt = require("prompt");
var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();

class Project {
  constructor (name) {
    this.name = name;
  }
  //Makes necessary directories, returns a Promise
  initDirects () {
    let path = process.cwd() + "/" + this.name;
    function mkRoot() {
      return new Promise((res, rej) => {
        fs.mkdir(path, (err) => {
          return err ? rej(err) : res();
        });
      });
    }
    function mkSubfolder(subfolder) {
      return new Promise((res, rej) => {
        fs.mkdir(path + subfolder, (err) => {
          return err ? rej(err) : res();
        });
      });
    }
    mkRoot()
      .then(mkSubfolder("/lib"))
      .then(mkSubfolder("/test"))
      .then(ee.emit("madeDirects"));
  }
  initFiles () {
    let defaultPath = process.cwd() + "/" + this.name;
    function readResource(filename) {
      return new Promise((res, rej) => {
        fs.readFile(__dirname + "/resources/" + filename, (err, data) => {
          return err ? rej(err) : res(filename, data);
        });
      });
    }
    function copyResource(filename, data, path=defaultPath) {
      return new Promise((res, rej) => {
        fs.writeFile(path + "/" + filename, data, (err) => {
          return err ? rej(err) : res();
        })
      })
    }
    readResource("gulpfile.js")
      .then(copyResource);
  }
}

class ProjectWithPackages extends Project {
  constructor (name) {
    super(name);
  }
  initFiles () {
    super.initFiles();
    // ee.on("baseFilesMade")
  }
}

//Prompts the user for a project name in the console, returns the name if directory does not already exist.
var promptName = () => {
  var properties = [{
    name: "projectName",
    validator: /^[a-zA-Z0-9\_\-]+$/,
    warning: "Project name must be only letters, numbers, underscores, or dashes."
  }];
  prompt.start();
  prompt.get(properties, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      //Check if directory already exists
      fs.stat(process.cwd() + "/" + result.projectName, function(err, stat) {
        if (err) {
          ee.emit("nameApproved", result.projectName);
        } else {
          console.log(`There is already a directory named '${result.projectName}' at ${process.cwd() + "/"}`);
          promptName();
        }
      });
    }
  });
}

//Prompts the user whether they want to init with packages or not, returns a Boolean
var promptPackages = () => {
  var properties = [{
    name: "withPackages",
    validator:/^(y{1}|Y{1}|n{1}|N{1})$/,
    warning: "Must answer y/Y or n/N"
  }];
  prompt.start();
  prompt.get(properties, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result.withPackages.toLowerCase() === "y") {
        ee.emit("packageOption", true);
      } else {
        ee.emit("packageOption", false);
      }
    }
  });
}

//Returns a new Project() or ProjectWithPackages() object, depending on user responses to promptName and promptPackages
var initProject = () => {
  var projectName;
  promptName();
  ee.on("nameApproved", (name) => {
    projectName = name;
    promptPackages();
  });
  ee.on("packageOption", (bool) => {
    if (bool) {
      ee.emit("projectObject", new ProjectWithPackages(projectName));
    } else {
      ee.emit("projectObject", new Project(projectName));
    }
  })
}

initProject();
var project;
ee.on("projectObject", (projectObject) => {
  project = projectObject;
  project.initDirects();
});
ee.on("madeDirects", () => {
  project.initFiles();
})
