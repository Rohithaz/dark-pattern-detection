let report=[]

// async function scanURL(){

// let url=document.getElementById("urlInput").value

// if(!url){
// alert("Enter URL")
// return
// }

// try{

// let proxy="https://api.allorigins.win/raw?url="

// let response=await fetch(proxy+encodeURIComponent(url))

// let html=await response.text()

// document.getElementById("htmlInput").value=html

// scanHTML()

// }catch(error){

// alert("Cannot access website")

// }

// }



// ✅ Toast Function (Modern UI)
function showToast(message, color){

  let toast = document.getElementById("toast")

  toast.innerText = message
  toast.style.background = color
  toast.style.display = "block"

  setTimeout(()=>{
    toast.style.display = "none"
  }, 3000)
}


// 🚀 UPDATED scanURL FUNCTION
async function scanURL(){

  let url = document.getElementById("urlInput").value.trim()

  if(!url){
    showToast("⚠️ Enter a valid URL", "#e67e22")
    return
  }

  // ⏳ Show loading
  showToast("⏳ Loading website...", "#f39c12")

  try{

    // let proxy = "https://api.allorigins.win/raw?url="

    let proxy = "https://corsproxy.io/?"


    // ✅ Timeout control
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    let response = await fetch(proxy + encodeURIComponent(url), {
      signal: controller.signal
    })

    clearTimeout(timeout)

    // ❌ If failed response
    if(!response.ok){
      throw new Error("Fetch failed")
    }

    let html = await response.text()

    // ✅ Update HTML
    document.getElementById("htmlInput").value = html

    // ✅ Success message
    showToast("✅ Website loaded successfully", "#27ae60")

    // Run your scanner
    scanHTML()

  }catch(error){

    if(error.name === "AbortError"){
      showToast("⏱️ Request timed out (slow site)", "#e74c3c")
    }else{
      showToast("❌ Website blocked or not accessible", "#e74c3c")
    }

  }
}






// function scanHTML(){

// let html=document.getElementById("htmlInput").value

// const parser=new DOMParser()

// const doc=parser.parseFromString(html,"text/html")

// let iframe = document.getElementById("preview")
// iframe.onload = highlightPreviewElements
// iframe.srcdoc = html





// report=[]

// report.push(...scanAllRules(doc))


// let mlScore=detectManipulativeLanguage(doc.body.textContent.toLowerCase())

// if(mlScore>=2){

// report.push({
// pattern:"Manipulative Marketing Language",
// severity:"Medium",
// confidence:0.75
// })

// }

// highlightElements(doc)

// displayResults()

// updateStats()

// }





function scanHTML(){

  let html = document.getElementById("htmlInput").value

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  let iframe = document.getElementById("preview")

  // 🔥 IMPORTANT: wait for iframe, then highlight using SAME report
  iframe.onload = () => {
    highlightPreviewElements(report)   // pass report here
  }

  iframe.srcdoc = html

  report = []

  // ✅ RULE ENGINE (same as before)
  report.push(...scanAllRules(doc))

   console.log("REPORT:", report)
  console.log("FIRST ISSUE:", report[0])

  // ✅ ML
  let mlScore = detectManipulativeLanguage(doc.body.textContent.toLowerCase())

  if(mlScore >= 2){
    report.push({
      pattern:"Manipulative Marketing Language",
      severity:"Medium",
      confidence:0.75,
      evidence:"Detected persuasive or manipulative wording patterns",
      recommendation:"Use neutral and transparent language"
    })
  }

  // ❌ DO NOT highlight parsed doc (remove this)
  // highlightElements(doc)

  // ✅ UI update
  displayResults()
  updateStats()

}




function highlightElements(doc){

doc.querySelectorAll("button,input,a").forEach(el=>{

let text=el.textContent.toLowerCase()

if(text.includes("accept") || text.includes("buy")){

el.classList.add("heatmap")

}

})

}

function highlightPreviewElements(report){

  let iframe = document.getElementById("preview")
  if(!iframe.contentDocument) return

  let doc = iframe.contentDocument

  // ✅ inject style once
  let style = doc.createElement("style")
  style.innerHTML = `
   .heatmap {
    outline: 3px solid #ff1744 !important;
    box-shadow: 0 0 12px rgba(255, 23, 68, 0.8) !important;
    border-radius: 4px;
    transition: all 0.3s ease;
    padding:10px;
  }
  `
  doc.head.appendChild(style)

  // 🔥 LOOP THROUGH DETECTED ISSUES
report.forEach(issue => {

  // ✅ Pre-selected checkbox
  if(issue.pattern === "Pre-selected Checkbox"){
    doc.querySelectorAll('input[type="checkbox"]').forEach(box=>{
      if(box.checked){
        box.classList.add("heatmap")
      }
    })
  }

  // ✅ Fake Scarcity
  if(issue.pattern.includes("Fake Scarcity")){
    doc.querySelectorAll("*").forEach(el=>{
      let text = el.textContent.toLowerCase()
      if(text.includes("only") && text.includes("left")){
        el.classList.add("heatmap")
      }
    })
  }

  // ✅ Confirm Shaming
  if(issue.pattern === "Confirm Shaming"){
    doc.querySelectorAll("*").forEach(el=>{
      let text = el.textContent.toLowerCase()
      if(text.includes("no thanks") || text.includes("i hate")){
        el.classList.add("heatmap")
      }
    })
  }

  // ✅ Countdown
  if(issue.pattern === "Countdown Timer Pressure"){
    doc.querySelectorAll("*").forEach(el=>{
      let text = el.textContent
      if(/\d{1,2}:\d{2}/.test(text)){
        el.classList.add("heatmap")
      }
    })
  }

  // ✅ Missing Reject Button
  if(issue.pattern === "Missing Reject Button"){
    doc.querySelectorAll("button").forEach(btn=>{
      btn.classList.add("heatmap")
    })
  }

  // 🔥 ADD THIS PART HERE 👇
  if(issue.pattern === "Disguised Ad"){
    doc.querySelectorAll("button, a").forEach(el=>{
      let text = el.textContent.toLowerCase()
      let parentText = el.parentElement?.textContent.toLowerCase() || ""

      if (/(download|install|play|get)/.test(text) &&
          /(ad|advertisement|sponsored|promo)/.test(parentText)) {

        el.classList.add("heatmap")
      }
    })
  }






  
})

}





function displayResults(){

let container=document.getElementById("results")

container.innerHTML=""

if(report.length===0){

container.innerHTML="<p>No supported dark patterns detected</p>"

return

}


report.forEach(issue => {

  let div = document.createElement("div")
  div.classList.add("issue")

  div.innerHTML = `
    <b>${issue.pattern}</b><br>

    <span><b>Severity:</b> ${issue.severity}</span><br>
    <span><b>Confidence:</b> ${(issue.confidence * 100).toFixed(0)}%</span><br>

    <span><b>Evidence:</b> ${issue.evidence || "N/A"}</span><br>
    <span><b>Recommendation:</b> ${issue.recommendation || "N/A"}</span>
  `

  container.appendChild(div)

})

}



function updateStats(){

let high=0
let totalConfidence=0

report.forEach(i=>{

if(i.severity==="High") high++

totalConfidence+=i.confidence

})

let avg=(totalConfidence/report.length)||0

document.getElementById("issueCount").innerText=report.length
document.getElementById("highCount").innerText=high
document.getElementById("confidenceScore").innerText=Math.round(avg*100)+"%"

}



// function downloadReport(){

// let json=JSON.stringify(report,null,2)

// let blob=new Blob([json],{type:"application/json"})

// let url=URL.createObjectURL(blob)

// let a=document.createElement("a")

// a.href=url
// a.download="dark-pattern-report.json"

// a.click()

// }



function toggleDropdown() {
  let menu = document.getElementById("dropdownMenu");
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}


// UPDATED FUNCTION
function downloadReport(type, sourceType = "Pasted HTML") {

  // hide dropdown after click
  document.getElementById("dropdownMenu").style.display = "none";

  // ================= JSON DOWNLOAD (UNCHANGED) =================
  if (type === "json") {

    let json = JSON.stringify(report, null, 2);
    let blob = new Blob([json], { type: "application/json" });

    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");

    a.href = url;
    a.download = "dark-pattern-report.json";
    a.click();
  }

  // ================= PDF DOWNLOAD (FIXED) =================
  else if (type === "pdf") {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 15;

    // 🔷 HELPER: TEXT WRAP
    function addText(label, value, indent = 10) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - indent - 10;

      let lines = doc.splitTextToSize(`${label}: ${value}`, maxWidth);

      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, indent, y);
        y += 6;
      });
    }

    // 🔷 SUMMARY CALCULATION
    let total = report.length;
    let high = 0, medium = 0, low = 0;
    let confidenceSum = 0;

    report.forEach(r => {
      if (r.severity === "High") high++;
      else if (r.severity === "Medium") medium++;
      else if (r.severity === "Low") low++;

      confidenceSum += r.confidence || 0;
    });

    let avgConfidence = total ? (confidenceSum / total).toFixed(2) : 0;

    // 🔷 TITLE
    doc.setFontSize(18);
    doc.text("Dark Pattern Detection Report", 10, y);
    y += 10;

    doc.setFontSize(10);

    // 🔷 META INFO (FIXED)
    addText("Scan Date", new Date().toLocaleString());
    addText("Input Type", sourceType);

    y += 4;

    // 🔷 SUMMARY
    doc.setFontSize(12);
    doc.text("Summary", 10, y);
    y += 8;

    doc.setFontSize(10);
    addText("Total Issues", total);
    addText("High Severity", high);
    addText("Medium Severity", medium);
    addText("Low Severity", low);
    addText("Average Confidence", avgConfidence);

    y += 6;

    // 🔷 FINDINGS
    doc.setFontSize(12);
    doc.text("Detailed Findings", 10, y);
    y += 8;

    doc.setFontSize(10);

    report.forEach((item, index) => {

      if (y > 270) {
        doc.addPage();
        y = 15;
      }

      // 🔹 Pattern Title
      doc.setFont(undefined, "bold");
      doc.text(`${index + 1}. ${item.pattern}`, 10, y);
      y += 6;

      doc.setFont(undefined, "normal");

      addText("Severity", item.severity, 12);
      addText("Confidence", item.confidence, 12);
      addText("Evidence", item.evidence || "N/A", 12);
      addText("Recommendation", item.recommendation || "N/A", 12);

      y += 4;
    });

    doc.save("dark-pattern-report.pdf");
  }
}


// OPTIONAL: close dropdown when clicking outside
document.addEventListener("click", function(e) {
  let dropdown = document.getElementById("dropdownMenu");
  if (!e.target.closest("button")) {
    dropdown.style.display = "none";
  }
});
