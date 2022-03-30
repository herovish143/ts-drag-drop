// drag and drop Interfaces
interface Dragable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;

}

// Project Type Class
enum ProjectStatus {
    Active,
    Finished
}

class Project {
    constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus ) {

    }
}


type ProjectListener<T> =  (items: T[]) => void;

// State Base class

class State<T> {
    protected listeners: ProjectListener<T>[] = [];

    constructor() {

    }

    addListeners(listenerFn: ProjectListener<T>) {
        this.listeners.push(listenerFn);
    }
}

// Project Management Class
class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();

    }

    static getInstance() {
        if(this.instance) {
            return this.instance;
        }

        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title:string, description: string, people: number ) {
        const newProject = new Project(Math.random().toString(), title, description, people, ProjectStatus.Active);
        this.projects.push(newProject);

        this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
        const project = this.projects.find( prj => prj.id === projectId);
        if(project && project.status !== newStatus) {
            project.status = newStatus;
            this.updateListeners();
        }

    }

    getProjectsList() {
        return this.projects;
    }
    private updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

// validation 
interface  Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: Validatable) {
    let isValid = true;
    if(validatableInput.required) {
        
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }

    if(validatableInput.minLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }

    if(validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.maxLength;
    }

    if(validatableInput.min != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }

    if(validatableInput.max != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }

    return isValid;
}

// autobind decorator
function autobind(_:any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = { 
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn
        }
    };

    return adjDescriptor;
}

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

const prjInput = new ProjectInput();

const activePrjList = new ProjectList('active');

const finishedPrjList = new ProjectList('finished');