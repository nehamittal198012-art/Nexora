const progress = document.getElementById("progress");
const taskInput = document.getElementById("taskInput");
const addTask = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const searchTask = document.getElementById("searchTask");
const subject =
new URLSearchParams(window.location.search).get("subject") || "General";

const storageKey = "studyTasks_" + subject;

let defaultTasks = [];

if (subject === "DBMS") {
defaultTasks = [
{ text: "Study DBMS Keys", completed: false },
{ text: "Revise ER Diagram", completed: false },
{ text: "Study Normalization", completed: false },
{ text: "Practice DBMS Questions", completed: false }
];
}

else if (subject === "DAA") {
defaultTasks = [
{ text: "Study B-Tree", completed: false },
{ text: "Practice Sorting", completed: false },
{ text: "Revise Red-Black Tree", completed: false },
{ text: "Practice DAA Questions", completed: false }
];
}

else if (subject === "Machine Learning") {
defaultTasks = [
{ text: "Study Regression", completed: false },
{ text: "Revise Classification", completed: false },
{ text: "Study Machine Learning Algorithms", completed: false },
{ text: "Practice ML Questions", completed: false }
];
}

else if (subject === "Web Technology") {
defaultTasks = [
{ text: "Revise HTML", completed: false },
{ text: "Practice CSS", completed: false },
{ text: "Study JavaScript", completed: false },
{ text: "Practice Web Technology Questions", completed: false }
];
}

else {
defaultTasks = [
{ text: "Study Today's Topic", completed: false },
{ text: "Revise Notes", completed: false }
];
}

let tasks =
JSON.parse(localStorage.getItem(storageKey)) || defaultTasks;

function showTasks() {

    taskList.innerHTML = "";

    const searchText =
        searchTask.value.toLowerCase().trim();

    tasks.forEach(function (task, index) {

        if (!task.text.toLowerCase().includes(searchText)) {
            return;
        }

        const label = document.createElement("label");

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        if (task.completed) {
            label.style.textDecoration = "line-through";
            label.style.opacity = "0.5";
        }

        checkbox.addEventListener("change", function () {

            tasks[index].completed = checkbox.checked;

            if (checkbox.checked) {
                label.style.textDecoration = "line-through";
                label.style.opacity = "0.5";
            } else {
                label.style.textDecoration = "none";
                label.style.opacity = "1";
            }

            localStorage.setItem(
                storageKey,
                JSON.stringify(tasks)
            );

            updateProgress();
        });

        label.appendChild(checkbox);

        label.appendChild(
            document.createTextNode(" " + task.text)
        );

        const priorityText =
            document.createElement("span");

        priorityText.textContent =
            " [" + (task.priority || "Medium") + "]";

        priorityText.style.marginLeft = "8px";
        priorityText.style.fontSize = "13px";
        priorityText.style.fontWeight = "bold";

        if (task.priority === "High") {
            priorityText.style.color = "#dc2626";
        } else if (task.priority === "Low") {
            priorityText.style.color = "#16a34a";
        } else {
            priorityText.style.color = "#ca8a04";
        }

        label.appendChild(priorityText);

        if (task.date) {

            const dateText =
                document.createElement("span");

            dateText.textContent =
                " 📅 " + task.date;

            dateText.style.marginLeft = "8px";
            dateText.style.fontSize = "13px";
            dateText.style.color = "#777";

            label.appendChild(dateText);
        }

        const deleteButton =
            document.createElement("button");

        deleteButton.textContent = "🗑️";
        deleteButton.style.marginLeft = "10px";
        deleteButton.style.padding = "5px 10px";
        deleteButton.style.fontSize = "14px";
        deleteButton.style.textDecoration = "none";

        deleteButton.addEventListener("click", function () {

            tasks.splice(index, 1);

            localStorage.setItem(
                storageKey,
                JSON.stringify(tasks)
            );

            showTasks();
        });

        label.appendChild(deleteButton);

        taskList.appendChild(label);

        taskList.appendChild(
            document.createElement("br")
        );
    });

    updateProgress();
}
    

    label.appendChild(checkbox);

    label.appendChild(
        document.createTextNode(" " + task.text)
    );const priorityText = document.createElement("span");

priorityText.textContent =
    " [" + (task.priority || "Medium") + "]";

priorityText.style.marginLeft = "8px";
priorityText.style.fontSize = "13px";
priorityText.style.fontWeight = "bold";
if (task.priority === "High") {
    priorityText.style.color = "#dc2626";
} else if (task.priority === "Low") {
    priorityText.style.color = "#16a34a";
} else {
    priorityText.style.color = "#ca8a04";
}

label.appendChild(priorityText);
if (task.date) {

    const dateText = document.createElement("span");

    dateText.textContent =
        " 📅 " + task.date;

    dateText.style.marginLeft = "8px";
    dateText.style.fontSize = "13px";
    dateText.style.color = "#777";

    label.appendChild(dateText);
}
    const deleteButton = document.createElement("button");

deleteButton.textContent = "🗑️";
deleteButton.style.marginLeft = "10px";
deleteButton.style.padding = "5px 10px";
deleteButton.style.fontSize = "14px";
deleteButton.style.textDecoration = "none";

deleteButton.addEventListener("click", function () {

    tasks.splice(index, 1);

    localStorage.setItem(
        storageKey,
        JSON.stringify(tasks)
    );

    showTasks();
});

label.appendChild(deleteButton);

    taskList.appendChild(label);

    taskList.appendChild(
        document.createElement("br")
    );

    taskList.appendChild(
        document.createElement("br")
    );
;

updateProgress();



function updateProgress() {

let completed = 0;

tasks.forEach(function (task) {

    if (task.completed) {
        completed++;
    }

});

progress.textContent =
    "Completed: " + completed + " / " + tasks.length;

}

addTask.addEventListener("click", function () {

const newTask = taskInput.value.trim();

if (newTask === "") {
    alert("Please enter a task!");
    return;
}

tasks.push({
    text: newTask,
    completed: false,
    priority: taskPriority.value,
    date: taskDate.value
});
localStorage.setItem(
    storageKey,
    JSON.stringify(tasks)
);

taskInput.value = "";

showTasks();

});

showTasks();
searchTask.addEventListener("input", function () {
    showTasks();
});
