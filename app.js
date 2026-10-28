const CATEGORIES = [
  "Roads & Potholes", "Garbage & Sanitation", "Streetlights", "Public Safety",
  "Water Supply", "Noise Disturbance", "Public Property", "Other"
];
const META = {
  "Roads & Potholes": {icon:"🚧", color:"bg-orange"},
  "Garbage & Sanitation": {icon:"♻️", color:"bg-green"},
  "Streetlights": {icon:"💡", color:"bg-yellow"},
  "Public Safety": {icon:"🛡️", color:"bg-red"},
  "Water Supply": {icon:"💧", color:"bg-blue"},
  "Noise Disturbance": {icon:"🔊", color:"bg-purple"},
  "Public Property": {icon:"🏙️", color:"bg-teal"},
  "Other": {icon:"✦", color:"bg-gray"}
};
const STATUSES = ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected"];
const $ = id => document.getElementById(id);
const STORE_KEY = "civicconnect_complaints_v1";
let complaints = loadComplaints();
let lastCreatedId = "";
let toastTimer;

function loadComplaints() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    if (Array.isArray(data)) return data;
  } catch {}
  return [];
}
function saveComplaints() {
  localStorage.setItem(STORE_KEY, JSON.stringify(complaints));
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function meta(category) { return META[category] || META.Other; }
function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}
function referenceId() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `CC-${date}-${Math.floor(1000+Math.random()*9000)}`;
}
function statusClass(status) {
  return ({ "Submitted":"status-submitted", "Under Review":"status-review", "In Progress":"status-progress", "Resolved":"status-resolved", "Rejected":"status-rejected" })[status] || "status-submitted";
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
function fillCategories() {
  $("reportCategory").innerHTML = '<option value="">Choose category</option>' + CATEGORIES.map(c=>`<option value="${escapeHTML(c)}">${meta(c).icon} ${escapeHTML(c)}</option>`).join("");
}
function showSection(id) {
  document.querySelectorAll(".section").forEach(section => section.classList.toggle("hidden",section.id!==id));
  document.querySelectorAll(".nav-link").forEach(btn=>btn.classList.toggle("active",btn.dataset.section===id));
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="complaintsSection") renderPublicComplaints();
  if(id==="authoritySection") renderAuthority();
}
function openReport(category="") {
  $("reportForm").reset();
  if(category) $("reportCategory").value=category;
  $("reportModal").showModal();
}
function statusPill(status) {
  return `<span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span>`;
}
function complaintCard(c) {
  const m=meta(c.category);
  return `<article class="complaint-card">
    <div class="complaint-top"><div class="complaint-title-wrap"><span class="complaint-icon ${m.color}">${m.icon}</span><div><h3>${escapeHTML(c.title)}</h3><div class="complaint-id">${escapeHTML(c.id)}</div></div></div>${statusPill(c.status)}</div>
    <div class="complaint-meta"><span>⌖ ${escapeHTML(c.location)}</span><span>▦ ${escapeHTML(c.category)}</span><span>◷ ${formatDate(c.createdAt)}</span></div>
    <p class="complaint-description">${escapeHTML(c.description.length>180?c.description.slice(0,180)+"…":c.description)}</p>
    <div class="complaint-bottom"><span class="priority ${c.priority.toLowerCase()}">● ${escapeHTML(c.priority)} priority</span><button data-track-id="${escapeHTML(c.id)}">View updates →</button></div>
  </article>`;
}
function renderStats() {
  $("totalReports").textContent=complaints.length;
  $("progressReports").textContent=complaints.filter(c=>["Under Review","In Progress"].includes(c.status)).length;
  $("resolvedReports").textContent=complaints.filter(c=>c.status==="Resolved").length;
  $("authorityStats").innerHTML=[
    ["Total complaints",complaints.length],
    ["Awaiting review",complaints.filter(c=>c.status==="Submitted"||c.status==="Under Review").length],
    ["In progress",complaints.filter(c=>c.status==="In Progress").length],
    ["Resolved",complaints.filter(c=>c.status==="Resolved").length]
  ].map(([label,count])=>`<div class="authority-stat"><span>${label}</span><strong>${count}</strong></div>`).join("");
}
function renderPublicComplaints() {
  const filter=$("publicStatusFilter").value;
  const list=[...complaints].filter(c=>filter==="all"||c.status===filter).sort((a,b)=>b.createdAt-a.createdAt);
  $("publicComplaintList").innerHTML=list.map(complaintCard).join("");
  $("publicEmpty").classList.toggle("hidden",list.length>0);
  $("publicComplaintList").classList.toggle("hidden",list.length===0);
  document.querySelectorAll("[data-track-id]").forEach(btn=>btn.addEventListener("click",()=>trackComplaint(btn.dataset.trackId)));
}
function trackComplaint(id) {
  const complaint=complaints.find(c=>c.id.toLowerCase()===String(id).trim().toLowerCase());
  const box=$("trackResult");
  box.classList.remove("hidden");
  if(!complaint) {
    box.innerHTML='<h3>We couldn’t find that complaint.</h3><p>Check the reference ID and try again. This demo can only find reports saved in this browser.</p>';
  } else {
    box.innerHTML=`<div class="complaint-top"><div><div class="complaint-id">${escapeHTML(complaint.id)}</div><h3 style="margin-top:7px">${escapeHTML(complaint.title)}</h3></div>${statusPill(complaint.status)}</div>
      <p>📍 ${escapeHTML(complaint.location)} · ${escapeHTML(complaint.category)} · Submitted ${formatDate(complaint.createdAt)}</p>
      <p>${escapeHTML(complaint.description)}</p>
      ${complaint.authorityNote?`<div class="authority-note"><strong>Latest authority update · ${formatDate(complaint.updatedAt||complaint.createdAt)}</strong><br>${escapeHTML(complaint.authorityNote)}</div>`:'<p>No authority update has been added yet.</p>'}`;
  }
  box.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function renderAuthority() {
  renderStats();
  const query=$("adminSearch").value.trim().toLowerCase();
  const filter=$("adminStatusFilter").value;
  const list=[...complaints].filter(c=>(filter==="all"||c.status===filter)&&`${c.id} ${c.title} ${c.location} ${c.category}`.toLowerCase().includes(query)).sort((a,b)=>b.createdAt-a.createdAt);
  $("authorityList").innerHTML=list.map(c=>`<article class="authority-card">
    <div class="authority-card-main"><div><div class="complaint-id">${escapeHTML(c.id)} · ${formatDate(c.createdAt)}</div><h3 style="margin-top:7px">${escapeHTML(c.title)}</h3><div class="admin-details"><span>📍 ${escapeHTML(c.location)}</span><span>${meta(c.category).icon} ${escapeHTML(c.category)}</span><span class="priority ${c.priority.toLowerCase()}">● ${escapeHTML(c.priority)} priority</span></div><p>${escapeHTML(c.description)}</p>${c.authorityNote?`<div class="authority-note"><strong>Latest note:</strong> ${escapeHTML(c.authorityNote)}</div>`:""}</div>
    <div class="authority-card-actions"><select aria-label="Status for ${escapeHTML(c.id)}" data-status-select="${escapeHTML(c.id)}">${STATUSES.map(s=>`<option ${c.status===s?"selected":""}>${s}</option>`).join("")}</select><button data-update-id="${escapeHTML(c.id)}">Update</button></div></div>
  </article>`).join("");
  $("authorityEmpty").classList.toggle("hidden",list.length>0);
  $("authorityList").classList.toggle("hidden",list.length===0);
  document.querySelectorAll("[data-update-id]").forEach(btn=>btn.addEventListener("click",()=>openUpdate(btn.dataset.updateId)));
}
function openUpdate(id) {
  const c=complaints.find(item=>item.id===id);
  if(!c) return;
  $("updateComplaintId").value=id;
  $("updateComplaintTitle").textContent=`${c.id} · ${c.title}`;
  $("updateStatus").value=c.status;
  $("updateNote").value=c.authorityNote||"";
  $("updateModal").showModal();
}
function submitUpdate(event) {
  event.preventDefault();
  const id=$("updateComplaintId").value;
  const c=complaints.find(item=>item.id===id);
  if(!c) return;
  c.status=$("updateStatus").value;
  c.authorityNote=$("updateNote").value.trim();
  c.updatedAt=new Date().toISOString();
  saveComplaints();
  $("updateModal").close();
  renderAuthority();renderPublicComplaints();renderStats();
  showToast("Complaint status updated in this browser");
}

document.querySelectorAll(".nav-link").forEach(btn=>btn.addEventListener("click",()=>showSection(btn.dataset.section)));
["headerReportBtn","heroReportBtn","categoriesReportBtn"].forEach(id=>$(id).addEventListener("click",()=>openReport()));
$("heroTrackBtn").addEventListener("click",()=>{showSection("complaintsSection");$("trackInput").focus();});
document.querySelectorAll(".category-card").forEach(btn=>btn.addEventListener("click",()=>openReport(btn.dataset.category)));
$("closeReport").addEventListener("click",()=>$("reportModal").close());
$("cancelReport").addEventListener("click",()=>$("reportModal").close());
$("reportModal").addEventListener("click",e=>{if(e.target===$("reportModal"))$("reportModal").close();});
$("reportForm").addEventListener("submit",event=>{
  event.preventDefault();
  const complaint={
    id:referenceId(),
    title:$("reportTitle").value.trim(),
    category:$("reportCategory").value,
    priority:$("reportPriority").value,
    location:$("reportLocation").value.trim(),
    description:$("reportDescription").value.trim(),
    name:$("reportName").value.trim(),
    contact:$("reportContact").value.trim(),
    status:"Submitted",
    authorityNote:"",
    createdAt:new Date().toISOString(),
    updatedAt:""
  };
  if(!complaint.title||!complaint.category||!complaint.location||!complaint.description){showToast("Please fill in all required fields");return;}
  complaints.unshift(complaint);saveComplaints();lastCreatedId=complaint.id;
  $("reportModal").close();$("newReference").textContent=complaint.id;$("successModal").showModal();
  renderStats();renderPublicComplaints();renderAuthority();
  $("reportForm").reset();
});
$("closeSuccess").addEventListener("click",()=>$("successModal").close());
$("successDone").addEventListener("click",()=>$("successModal").close());
$("successTrack").addEventListener("click",()=>{$("successModal").close();showSection("complaintsSection");$("trackInput").value=lastCreatedId;trackComplaint(lastCreatedId);});
$("copyReference").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(lastCreatedId);showToast("Reference ID copied");}
  catch{showToast("Your reference ID is "+lastCreatedId);}
});
$("trackBtn").addEventListener("click",()=>trackComplaint($("trackInput").value));
$("trackInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();trackComplaint($("trackInput").value);}});
$("publicStatusFilter").addEventListener("change",renderPublicComplaints);
$("adminSearch").addEventListener("input",renderAuthority);
$("adminStatusFilter").addEventListener("change",renderAuthority);
$("closeUpdate").addEventListener("click",()=>$("updateModal").close());
$("cancelUpdate").addEventListener("click",()=>$("updateModal").close());
$("updateModal").addEventListener("click",e=>{if(e.target===$("updateModal"))$("updateModal").close();});
$("updateForm").addEventListener("submit",submitUpdate);
fillCategories();
renderStats();renderPublicComplaints();renderAuthority();
