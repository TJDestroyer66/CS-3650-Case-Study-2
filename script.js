(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const form = $("#task-form");
  const dialog = $("#task-dialog");
  const detailsStep = $("#details-step");
  const reviewStep = $("#review-step");
  const successStep = $("#success-step");
  const saveButton = $("#save-task");
  const statusMessage = $("#status-message");
  const toastRegion = $("#toast-region");
  const fields = {
    title: $("#task-title"), course: $("#task-course"),
    description: $("#task-description"), due: $("#task-due")
  };
  let tasks = loadTasks();
  let activeFilter = "all";
  let lastFocused = null;
  let isSaving = false;

  const isoToday = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  $("#today-label").textContent = new Intl.DateTimeFormat(undefined, { weekday:"short", month:"short", day:"numeric" }).format(new Date());
  fields.due.min = isoToday();

  function loadTasks() {
    try {
      const saved = localStorage.getItem("studyflow-tasks-v1");
      if (saved) return JSON.parse(saved);
    } catch (_) { /* storage may be unavailable */ }
    return [
      {id:"sample-1", title:"Finish biology lab report", course:"Biology 101", description:"Review results and write the conclusion.", due:addDays(1), priority:"High", completed:false},
      {id:"sample-2", title:"Read chapter 6", course:"Psychology", description:"Take notes on the key terms.", due:addDays(3), priority:"Medium", completed:false},
      {id:"sample-3", title:"Submit discussion response", course:"Computer Science", description:"Reply to two classmates.", due:addDays(-1), priority:"Low", completed:true}
    ];
  }
  function addDays(n) { const d = new Date(); d.setDate(d.getDate()+n); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
  function persist() { try { localStorage.setItem("studyflow-tasks-v1", JSON.stringify(tasks)); } catch (_) { announce("Your browser could not save changes locally. The task may not persist after refresh."); } }
  function formatDate(value) {
    if (!value) return "No due date";
    const d = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat(undefined, {month:"short", day:"numeric", year:"numeric"}).format(d);
  }
  function announce(message) { statusMessage.textContent = ""; window.setTimeout(() => { statusMessage.textContent = message; }, 20); }
  function toast(message, type="success") {
    const item = document.createElement("div");
    item.className = `toast ${type}`; item.textContent = message;
    toastRegion.append(item); window.setTimeout(() => item.remove(), 3600);
  }
  function updateCounts() {
    $("#total-count").textContent = tasks.length;
    $("#completed-count").textContent = tasks.filter(t=>t.completed).length;
    $("#remaining-count").textContent = tasks.filter(t=>!t.completed).length;
  }
  function renderTasks() {
    const list = $("#task-list"); list.replaceChildren();
    const search = $("#search-input").value.trim().toLowerCase();
    const visible = tasks.filter(t => {
      const matchFilter = activeFilter==="all" || (activeFilter==="todo" && !t.completed) || (activeFilter==="completed" && t.completed) || (activeFilter==="upcoming" && !t.completed);
      const matchSearch = `${t.title} ${t.course} ${t.description||""}`.toLowerCase().includes(search);
      return matchFilter && matchSearch;
    }).sort((a,b)=>a.due.localeCompare(b.due));
    visible.forEach(task => {
      const article = document.createElement("article");
      article.className = `task-card${task.completed?" is-complete":""}`;
      const check = document.createElement("input");
      check.type="checkbox"; check.className="task-check"; check.checked=task.completed;
      check.setAttribute("aria-label", `${task.completed?"Mark incomplete":"Mark complete"}: ${task.title}`);
      check.addEventListener("change", () => {
        task.completed = check.checked; persist(); renderTasks();
        toast(task.completed ? "Task marked complete." : "Task moved back to to do.");
        announce(`${task.title} ${task.completed?"completed":"marked incomplete"}.`);
      });
      const body = document.createElement("div");
      const title = document.createElement("h3"); title.className="task-title"; title.textContent=task.title;
      const course = document.createElement("p"); course.className="task-course"; course.textContent=task.course;
      body.append(title,course);
      if(task.description){const desc=document.createElement("p");desc.className="task-description";desc.textContent=task.description;body.append(desc);}
      const meta = document.createElement("div"); meta.className="task-meta";
      const priority = document.createElement("span"); priority.className=`priority-pill ${task.priority}`; priority.textContent=task.priority;
      const due = document.createElement("span"); due.className="due-date"; due.textContent=`Due ${formatDate(task.due)}`;
      meta.append(priority,due); article.append(check,body,meta); list.append(article);
    });
    $("#empty-state").hidden = visible.length !== 0;
    list.hidden = visible.length === 0;
    updateCounts();
  }
  function setFilter(filter) {
    activeFilter=filter;
    $$(".tab").forEach(tab => { const selected=tab.dataset.filter===filter; tab.classList.toggle("active",selected); tab.setAttribute("aria-pressed",String(selected)); });
    renderTasks();
  }
  function clearErrors() {
    ["title","course","due"].forEach(name => { const input=fields[name], error=$(`#${name}-error`); input.removeAttribute("aria-invalid"); error.hidden=true; error.textContent=""; });
    $("#review-error").hidden=true;
  }
  function validateDetails() {
    clearErrors(); let valid=true; let firstInvalid=null;
    const rules=[
      ["title", v=>v.trim().length>0,"Enter a task title."],
      ["course", v=>v.trim().length>0,"Enter the course name."],
      ["due", v=>!!v,"Choose a due date."]
    ];
    for(const [name,check,message] of rules){
      const input=fields[name];
      if(!check(input.value)){input.setAttribute("aria-invalid","true");const error=$(`#${name}-error`);error.textContent=message;error.hidden=false;valid=false;firstInvalid ||= input;}
    }
    if(fields.due.value && fields.due.value < isoToday()){
      fields.due.setAttribute("aria-invalid","true");$("#due-error").textContent="Choose today or a future date.";$("#due-error").hidden=false;valid=false;firstInvalid ||= fields.due;
    }
    if(!valid){firstInvalid.focus();announce("Some task details need attention. Please review the error messages.");}
    return valid;
  }
  function currentTask() {
    return {title:fields.title.value.trim(),course:fields.course.value.trim(),description:fields.description.value.trim(),due:fields.due.value,priority:$('input[name="priority"]:checked').value};
  }
  function showStep(step) {
    detailsStep.hidden=step!=="details"; reviewStep.hidden=step!=="review"; successStep.hidden=step!=="success";
    $$("[data-step-indicator]").forEach(el=>{const n=Number(el.dataset.stepIndicator);el.classList.toggle("active",n===(step==="details"?1:step==="review"?2:3));el.classList.toggle("done",n<(step==="details"?1:step==="review"?2:3));});
    if(step==="details") fields.title.focus();
    if(step==="review") $("#back-to-details").focus();
    if(step==="success") $("#view-tasks").focus();
  }
  function openDialog() {
    lastFocused=document.activeElement; dialog.hidden=false; document.body.style.overflow="hidden";
    clearErrors(); form.reset(); fields.due.min=isoToday(); showStep("details");
  }
  function closeDialog() {
    if(isSaving) return;
    dialog.hidden=true; document.body.style.overflow=""; if(lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function renderReview() {
    const task=currentTask(), dl=$("#review-details"); dl.replaceChildren();
    const entries=[["Task title",task.title],["Course",task.course],["Description",task.description||"No description added"],["Due date",formatDate(task.due)],["Priority",task.priority]];
    entries.forEach(([label,value])=>{const row=document.createElement("div"),dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=label;dd.textContent=value;row.append(dt,dd);dl.append(row);});
  }
  function resetForAnother() { form.reset(); clearErrors(); fields.due.min=isoToday(); showStep("details"); }
  $("#add-task-top").addEventListener("click",openDialog);
  $("#empty-add").addEventListener("click",openDialog);
  $("#close-dialog").addEventListener("click",closeDialog);
  $("#cancel-task").addEventListener("click",closeDialog);
  dialog.addEventListener("click",e=>{if(e.target===dialog)closeDialog();});
  document.addEventListener("keydown",e=>{
    if(dialog.hidden)return;
    if(e.key==="Escape"){e.preventDefault();closeDialog();return;}
    if(e.key==="Tab"){
      const focusables=$$("button:not(:disabled),input:not(:disabled):not([type=hidden]),textarea:not(:disabled),a[href]",dialog).filter(el=>el.offsetParent!==null);
      if(!focusables.length)return;
      const first=focusables[0],last=focusables[focusables.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  $("#continue-review").addEventListener("click",()=>{if(validateDetails()){renderReview();showStep("review");announce("Review your task details before saving.");}});
  $("#back-to-details").addEventListener("click",()=>showStep("details"));
  $("#title-counter").textContent=`${fields.title.value.length}/80`;
  fields.title.addEventListener("input",()=>{$("#title-counter").textContent=`${fields.title.value.length}/80`;if(fields.title.value.trim()){fields.title.removeAttribute("aria-invalid");$("#title-error").hidden=true;}});
  fields.course.addEventListener("input",()=>{if(fields.course.value.trim()){fields.course.removeAttribute("aria-invalid");$("#course-error").hidden=true;}});
  fields.description.addEventListener("input",()=>{$("#description-counter").textContent=`${fields.description.value.length}/300`;});
  fields.due.addEventListener("change",()=>{if(fields.due.value && fields.due.value>=isoToday()){fields.due.removeAttribute("aria-invalid");$("#due-error").hidden=true;}});
  form.addEventListener("submit",async e=>{
    e.preventDefault(); if(isSaving || !validateDetails())return;
    isSaving=true; saveButton.disabled=true; saveButton.innerHTML='<span class="spinner" aria-hidden="true"></span> Saving…'; saveButton.setAttribute("aria-busy","true");
    announce("Saving your task. Please wait."); await new Promise(resolve=>setTimeout(resolve,700));
    try {
      const task={id:`task-${Date.now()}`,...currentTask(),completed:false};
      tasks.push(task); persist(); renderTasks();
      $("#success-message").textContent=`“${task.title}” has been added to your task list.`;
      $("#success-summary").replaceChildren();
      const strong=document.createElement("strong");strong.textContent=task.title;
      const p=document.createElement("p");p.textContent=`${task.course} · Due ${formatDate(task.due)} · ${task.priority} priority`;
      $("#success-summary").append(strong,p); showStep("success"); announce(`Task saved successfully: ${task.title}.`);
    } catch(_) {
      $("#review-error").textContent="We couldn't save this task. Please try again.";$("#review-error").hidden=false;announce("Task could not be saved. Please try again.");
    } finally {
      isSaving=false;saveButton.disabled=false;saveButton.textContent="Save task ✓";saveButton.removeAttribute("aria-busy");
    }
  });
  $("#view-tasks").addEventListener("click",()=>{setFilter("all");closeDialog();$("#dashboard-heading").focus?.();});
  $("#create-another").addEventListener("click",resetForAnother);
  $("#search-input").addEventListener("input",renderTasks);
  $$(".tab").forEach(tab=>tab.addEventListener("click",()=>setFilter(tab.dataset.filter)));
  $$("[data-filter-link]").forEach(link=>link.addEventListener("click",e=>{e.preventDefault();setFilter(link.dataset.filterLink);}));
  renderTasks();
})();