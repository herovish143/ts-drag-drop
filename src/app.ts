
/// <reference path="models/project.ts" />
/// <reference path="components/project-input.ts" />
/// <reference path="components/project-list.ts" />
namespace Vis {
  new ProjectInput();

  new ProjectList("active");

  new ProjectList("finished");
}
