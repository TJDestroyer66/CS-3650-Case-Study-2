
# Annotated Code Snippets — StudyFlow

## 1. Form Validation and Error Feedback

**Location:** `script.js` — `validateDetails()`

```javascript
if (!check(input.value)) {
  input.setAttribute("aria-invalid", "true");
  const error = $(`#${name}-error`);
  error.textContent = message;
  error.hidden = false;
  valid = false;
  firstInvalid ||= input;
}
```

**Annotation:** When a required field is invalid, the code marks it with `aria-invalid="true"`, displays an explanatory error message, and remembers the first invalid field. This helps users identify and correct errors.

## 2. Loading State and Duplicate Submission Prevention

**Location:** `script.js` — form submission handler

```javascript
if (isSaving || !validateDetails()) return;

isSaving = true;
saveButton.disabled = true;
saveButton.innerHTML =
  '<span class="spinner" aria-hidden="true"></span> Saving…';
saveButton.setAttribute("aria-busy", "true");

announce("Saving your task. Please wait.");
```

**Annotation:** The saving flag prevents another submission while the current save is processing. The button becomes disabled, displays a loading indicator, and exposes its busy state to assistive technology.

## 3. Persistent Task Storage

**Location:** `script.js` — `persist()`

```javascript
function persist() {
  try {
    localStorage.setItem(
      "studyflow-tasks-v1",
      JSON.stringify(tasks)
    );
  } catch (_) {
    announce(
      "Your browser could not save changes locally. " +
      "The task may not persist after refresh."
    );
  }
}
```

**Annotation:** Tasks are stored in the browser's local storage so they can persist across page refreshes. If local storage fails, the application announces a warning instead of silently ignoring the problem.

## 4. Accessible Status Announcements

**Location:** `script.js` — `announce()`

```javascript
function announce(message) {
  statusMessage.textContent = "";
  window.setTimeout(() => {
    statusMessage.textContent = message;
  }, 20);
}
```

**Annotation:** This function updates the status message used to communicate events such as saving progress and task creation. The associated live-region markup in `index.html` allows assistive technologies to announce status changes.
