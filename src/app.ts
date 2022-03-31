/// <reference  path="drag-drop-interfaces.ts" />
/// <reference path="validate-util.ts" />
/// <reference path="autobind-decorator.ts" />
/// <reference path="project-model.ts" />
/// <reference path="state-modal.ts" />
namespace Vis {    

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;

        const importedNode = document.importNode(this.templateElement.content, true);

        this.element = importedNode.firstElementChild as U;
        if(newElementId) {
            this.element.id = newElementId;
        }

        this.attach(insertAtStart);
    }

    private attach(pos: boolean) {
        this.hostElement.insertAdjacentElement(pos ? 'afterbegin': 'beforeend', this.element);
    }

    abstract configure(): void;

    abstract renderContent(): void;
}

// Projet Item class

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Dragable {
    private project: Project;

    get persons() {
        if(this.project.people === 1) {
            return '1 person assigned.';
        } else {
            return `${this.project.people} persons assigned.`;
        }
    }

    constructor(hostId: string, project: Project) {
        super('single-project', hostId, false, project.id);
        this.project = project;

        this.configure();

        this.renderContent();
    }

    @autobind
    dragStartHandler(event: DragEvent): void {
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    @autobind
    dragEndHandler(_: DragEvent): void {
        
    }
    configure(): void {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
    }

    renderContent(): void {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons;
        this.element.querySelector('p')!.textContent = this.project.description;
        
    }
}

// Project List Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {


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


// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {

    titleInput: HTMLInputElement;
    descriptionInput: HTMLInputElement;
    peopleInput: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true,'user-input');
       
        
        this.titleInput = this.element.querySelector("#title")! as HTMLInputElement;
        this.descriptionInput = this.element.querySelector("#description")! as HTMLInputElement;
        this.peopleInput = this.element.querySelector("#people")! as HTMLInputElement;
        
        this.configure();
        
    }
    configure() {
        this.element.addEventListener('submit', this.submitHandler);
    }
    
    renderContent(): void {
        
    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInput.value;
        const enteredDescription = this.descriptionInput.value;
        const enteredPeople = this.peopleInput.value;

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
        };

        const descriptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };

        const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if(
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable) 
        ) {
            alert('Invalid input, please try again..');
            this.clearInput();
            return;
        }

        return [enteredTitle, enteredDescription, +enteredPeople];

    }

    private clearInput() {
        this.titleInput.value = '';
        this.descriptionInput.value = '';
        this.peopleInput.value = '';
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();

        if(Array.isArray(userInput)) {
            const [title, description, people] = userInput;

            projectState.addProject(title, description, people);
            this.clearInput();
            console.log(title, description, people);
        }
        // console.log(this.titleInput.value, userInput);
    }


}

 new ProjectInput();

new ProjectList('active');

new ProjectList('finished');
}