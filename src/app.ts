/// <reference  path="models/drag-drop.ts" />
/// <reference path="utils/validation.ts" />
/// <reference path="decorators/autobind.ts" />
/// <reference path="state/project.ts" />
/// <reference path="models/project.ts" />
/// <reference path="components/project-input.ts" />
/// <reference path="components/project-item.ts" />
/// <reference path="components/project-list.ts" />
namespace Vis {
  new ProjectInput();

  new ProjectList("active");

  new ProjectList("finished");
}
