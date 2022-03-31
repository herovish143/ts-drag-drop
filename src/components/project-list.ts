import { Component } from "./base-component";
import { DragTarget } from "../models/drag-drop";
import { Project, ProjectStatus } from "../models/project";
import { autobind } from "../decorators/autobind";
import { projectState } from "../state/project";
import { ProjectItem } from "./project-item";
export class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {


    assignedProject: Project[] = [];



    constructor(private type: 'active' | 'finished') {
        super('project-list', "app", false, `${type}-projects`);
       
        this.element.id = `${this.type}-projects`;

        this.configure();

        this.renderContent();
    }

    @autobind
    dropHandler(event: DragEvent): void {
       const prjId = event.dataTransfer!.getData('text/plain');

       projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
    }

    @autobind
    dragOverHandler(event: DragEvent): void {
        if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const listEL = this.element.querySelector('ul')!;
            listEL.classList.add('droppable');
        }
    }

    @autobind
    dragLeaveHandler(_: DragEvent): void {
        const listEL = this.element.querySelector('ul')!;
        listEL.classList.remove('droppable');
    }

    configure(): void {

        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        projectState.addListeners((projects: any[]) => {
            const releveantProjects = projects.filter( prj => {
                if(this.type === 'active') {
                    return prj.status === ProjectStatus.Active;
                }
                return prj.status === ProjectStatus.Finished;
            });
            this.assignedProject = releveantProjects;
            console.log(releveantProjects, projects);
            this.renderProjects();
        });
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;

        this.element.querySelector("ul")!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' Projects';
    }

    private renderProjects() {
        const listEL = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEL.innerHTML = '';
        for (const prjItem of this.assignedProject) {
            new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
        }
    }

}
