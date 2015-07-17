var fs = require("fs");
var spawn = require("child_process").exec;
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
    //Reads last file in array from bob_the/resources directory, returns Promise with array for copyResource
    function readResource(filenameArray) {
      let filename = filenameArray.pop();
      return new Promise((res, rej) => {
        fs.readFile(__dirname + "/resources/" + filename, (err, data) => {
          let promisedArray = [filename, data, filenameArray];
          return err ? rej(err) : res(promisedArray);
        });
      });
    }
    //Copies resource read by readResource, returns Promise with array of fileNames left to read / copy
    function copyResource(promisedArray, path=defaultPath) {
      let filename = promisedArray[0], data = promisedArray[1], filenameArray = promisedArray[2];
      return new Promise((res, rej) => {
        fs.writeFile(path + "/" + filename, data, (err) => {
          return err ? rej(err) : res(filenameArray);
        });
      });
    }
    readResource(["gulpfile.js",".jscsrc",".jshintrc"])
      .then(copyResource)
      .then(readResource)
      .then(copyResource)
      .then(readResource)
      .then(copyResource)
      .then(() => ee.emit("baseFilesCopied"));
  }
}

class ProjectWithPackageAndGit extends Project {
  constructor (name) {
    super(name);
  }
  specSetup () {
    let path = process.cwd() + "/" + this.name;
    let name = this.name;
    //Reads .btrc file from bob_the/resources directory, Returns Promise with Object form of the data
    function readBTRC () {
      return new Promise((res, rej) => {
        fs.readFile(__dirname + "/resources/.tbrc", (err, data) => {
          let btrc = JSON.parse(data.toString());
          //console.log(btrc);
          return err ? rej(err) : res(btrc);
        });
      });
    }
    //Writes the package.json to the project root, filling in default name and version.
    function writePackageJSON (btrc) {
      let packageJSONObject = btrc;
      packageJSONObject["name"] = name;
      packageJSONObject["version"] = "0.1.0";
      let packageJSONString = JSON.stringify(packageJSONObject);
      return new Promise((res, rej) => {
        fs.writeFile(path + "/package.json", packageJSONString, (err) => {
          return err ? rej(err) : res();
        });
      });
    }
    //runs npm install command, to install all dependencies
    function npmInstaller() {
      let workingDirectory = process.cwd() + "/" + name;
      return new Promise((res, rej) => {
        let npmInstall = spawn("npm install", {cwd: workingDirectory});
        npmInstall.stdout.on("data", (data) => {
          console.log(data);
        });
        npmInstall.stderr.on("data", (data) => {
          console.log(data);
        });
        npmInstall.on("close", (code) => {
          return res();
        });
      });
    }
    //Inits a git repo in the root folder
    function gitInitter() {
      let workingDirectory = process.cwd() + "/" + name;
      return new Promise((res, rej) => {
        let initGit = spawn("git init", {cwd: workingDirectory});
        initGit.stdout.on("data", (data) => {
          console.log(data);
        });
        initGit.stderr.on("data", (data) => {
          console.log(data);
        });
        initGit.on("close", (code) => {
          return res();
        });
      });
    }
    //Creates a .gitignore file with node_modules
    function writeGitIgnore() {
      return new Promise((res, rej) => {
        fs.writeFile(path + "/.gitignore", "node_modules", (err) => {
          return err ? rej(err) : res("written");
        });
      });
    }
    readBTRC().then(writePackageJSON).then(npmInstaller).then(gitInitter).then(writeGitIgnore).then(console.log);
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
var promptPackage = () => {
  var properties = [{
    name: "withPackageAndGit",
    validator:/^(y{1}|Y{1}|n{1}|N{1})$/,
    warning: "Must answer y/Y or n/N"
  }];
  prompt.start();
  prompt.get(properties, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result.withPackageAndGit.toLowerCase() === "y") {
        ee.emit("packageOption", true);
      } else {
        ee.emit("packageOption", false);
      }
    }
  });
}

//Returns a new Project() or ProjectWithPackageAndGit() object, depending on user responses to promptName and promptPackage
var makeProject = () => {
  var projectName;
  promptName();
  ee.on("nameApproved", (name) => {
    projectName = name;
    promptPackage();
  });
  ee.on("packageOption", (bool) => {
    if (bool) {
      ee.emit("projectObject", new ProjectWithPackageAndGit(projectName));
    } else {
      ee.emit("projectObject", new Project(projectName));
    }
  })
}

makeProject();
var project;
ee.on("projectObject", (projectObject) => {
  project = projectObject;
  project.initDirects();
});
ee.on("madeDirects", () => {
  project.initFiles();
});
ee.on("baseFilesCopied", () => {
  if (ProjectWithPackageAndGit.prototype.isPrototypeOf(project)) {
    project.specSetup();
  } else {
    ee.emit("SpecSetupComplete");
  }
});
ee.on("SpecSetupComplete", () => {
  console.log("SpecSetupComplete");
});
