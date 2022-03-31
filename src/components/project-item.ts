/// <reference path="base-component.ts" />
/// <reference path="../decorators/autobind.ts" />
/// <reference  path="../models/drag-drop.ts" />
namespace Vis {
  // Projet Item class

  export class ProjectItem
    extends Component<HTMLUListElement, HTMLLIElement>
    implements Dragable
  {
    private project: Project;

    get persons() {
      if (this.project.people === 1) {
        return "1 person assigned.";
      } else {
        return `${this.project.people} persons assigned.`;
      }
    }

    constructor(hostId: string, project: Project) {
      super("single-project", hostId, false, project.id);
      this.project = project;

      this.configure();

      this.renderContent();
    }

    @autobind
    dragStartHandler(event: DragEvent): void {
      event.dataTransfer!.setData("text/plain", this.project.id);
      event.dataTransfer!.effectAllowed = "move";
    }

    @autobind
    dragEndHandler(_: DragEvent): void {}
    configure(): void {
      this.element.addEventListener("dragstart", this.dragStartHandler);
      this.element.addEventListener("dragend", this.dragEndHandler);
    }

    renderContent(): void {
      this.element.querySelector("h2")!.textContent = this.project.title;
      this.element.querySelector("h3")!.textContent = this.persons;
      this.element.querySelector("p")!.textContent = this.project.description;
    }
  }
}
