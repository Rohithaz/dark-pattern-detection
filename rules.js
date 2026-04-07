// ================= EXISTING RULES (IMPROVED + ENHANCED OUTPUT) =================



// Attribuite Analysis
function getAttributes(el){
  const style = window.getComputedStyle(el);

  return {
    tag: el.tagName,

    // INPUT STATES
    checked: el.checked || false,
    disabled: el.disabled || false,
    type: el.getAttribute("type"),

    // VISIBILITY (VERY IMPORTANT)
    hidden:
      el.hidden ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0",

    // LINKS
    href: el.getAttribute("href"),
    target: el.getAttribute("target"),

    // BUTTON / ROLE
    role: el.getAttribute("role"),

    // ACCESSIBILITY
   ariaHidden: el.getAttribute("aria-hidden") === "true",

    // TEXT
    text: el.innerText?.toLowerCase() || ""
  };
}




//Context Checks
function getContext(el){
  return {
    parent: el.parentElement,
    siblings: Array.from(el.parentElement?.children || []),
    form: el.closest("form"),

    // 🔥 STRONGER MODAL DETECTION
    modal: el.closest('[role="dialog"], .modal, [class*="modal"], [id*="modal"]'),

    section: el.closest("section, div")
  };
}


//selector

function getSelector(el){

  if(!el) return "";

  let path = [];

  while(el && el.nodeType === 1){

    let selector = el.nodeName.toLowerCase();

    if(el.id){
      selector += "#" + el.id;
      path.unshift(selector);
      break;
    }

    let sibling = el;
    let nth = 1;

    while(sibling = sibling.previousElementSibling){
      nth++;
    }

    selector += `:nth-child(${nth})`;
    path.unshift(selector);

    el = el.parentElement;
  }

  return path.join(" > ");
}



//confidence Score

function calculateConfidence(signals){

  let score = 0;

  // 🔥 assign weights
  const weights = {
    strong: 0.4,
    medium: 0.25,
    weak: 0.15
  };

  signals.forEach(s => {
    if(s === "strong") score += weights.strong;
    else if(s === "medium") score += weights.medium;
    else if(s === "weak") score += weights.weak;
  });

  return Math.min(1, score);
}






// Pre-selected Checkbox (reduced false positives)
function rulePrecheckedCheckbox(doc){

let issues=[]

doc.querySelectorAll('input[type="checkbox"]').forEach(box=>{

let attr = getAttributes(box);

if(attr.checked && !attr.disabled && attr.type === "checkbox"){

issues.push({
id: "DP001",                     
category: "Forced Action",      
description: "Checkbox is pre-selected", 
pattern:"Pre-selected Checkbox",
severity:"Medium",
confidence:0.85,
element:box,
selector: getSelector(box),
evidence:"Checkbox is pre-selected by default",
recommendation:"Do not pre-select options; let users actively choose"
})

}

})

return issues
}



// Missing Reject Button
function ruleMissingReject(doc){

let accept=false
let reject=false

doc.querySelectorAll("button").forEach(btn=>{

let text = (btn.textContent || "").toLowerCase()

if(text.includes("accept") || text.includes("yes") || text.includes("continue")) accept=true

if(
  text.includes("reject") ||
  text.includes("decline") ||
  text.includes("no")
) reject=true

})

if(accept && !reject){

return [{

id: "DP002",
category: "Misdirection",
description: "Accept option without clear reject",

pattern:"Missing Reject Button",
severity:"High",
confidence:0.92,

element: doc.body, // ✅ ADD (for highlighting consistency)
selector: getSelector(doc.body),

evidence:"Accept option found without a clear reject/decline option",
recommendation:"Provide equal visibility for both accept and reject choices"

}]

}

return []
}


// Fake Scarcity (multi-signal improved)

function ruleFakeScarcity(doc){

let issues=[]
let text = (doc.body.textContent || "").toLowerCase()

let scarcity = /(only \d+.*left|limited stock|selling fast)/.test(text)
let urgency = /(hurry|act fast|now)/.test(text)

// 🔥 DEFINE SIGNALS FIRST
let signals = []

if(scarcity) signals.push("strong")
if(urgency) signals.push("strong")

// 🔥 DEFINE CONFIDENCE BEFORE USING
let confidence = calculateConfidence(signals)

if(scarcity && urgency){

issues.push({

id: "DP003",
category: "Urgency",
description: "Strong scarcity and urgency signals detected",

pattern:"Fake Scarcity (Strong Signal)",
severity:"High",
confidence: confidence, // ✅ now works

element: doc.body,
selector: "body",

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Avoid misleading urgency unless it reflects real-time stock"

})

}else if(scarcity){

let weakSignals = ["medium"]
let weakConfidence = calculateConfidence(weakSignals)

issues.push({

id: "DP003",
category: "Urgency",
description: "Scarcity messaging detected",

pattern:"Fake Scarcity",
severity:"Medium",
confidence: weakConfidence, // ✅ separate confidence

element: doc.body,
selector: "body",

evidence:"Signals detected: scarcity",
recommendation:"Ensure stock messages are accurate and verifiable"

})

}

return issues
}


// Countdown Timer (improved detection)

function ruleCountdownTimer(doc){

let issues=[]

doc.querySelectorAll("*").forEach(el=>{

let text = el.textContent || ""

// 🔥 SIGNALS
let signals = []

if(/\b\d{1,2}:\d{2}(:\d{2})?\b/.test(text)) signals.push("strong")
if(text.toLowerCase().includes("ends in")) signals.push("medium")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 ONLY IF SIGNALS EXIST
if(signals.length > 0){

issues.push({

id: "DP004",
category: "Urgency",
description: "Countdown timer creating pressure",

pattern:"Countdown Timer Pressure",
severity:"High",
confidence: confidence,

element: el,
selector: getSelector(el),

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Avoid pressure-based timers unless genuinely time-bound"

})

}

})

return issues

}



// Confirm Shaming (regex improved)


function ruleConfirmShaming(doc){

let issues=[]
let text = (doc.body.textContent || "").toLowerCase()

let pattern = /(no thanks|i don't want|i hate|not interested|skip savings)/

if(pattern.test(text)){
issues.push({

id: "DP005",
category: "Misdirection",
description: "Guilt-inducing or negative opt-out language",

pattern:"Confirm Shaming",
severity:"Medium",
confidence:0.8,

element: doc.body, 
selector: getSelector(doc.body),
evidence:"Negative or guilt-inducing opt-out language detected",
recommendation:"Use neutral and respectful wording for opt-out actions"

})
}

return issues

}



// ================= NEW ADVANCED RULES =================

// Hidden Costs

function ruleHiddenCosts(doc){

let issues=[]

doc.querySelectorAll("p, span, div").forEach(el => {

let text = (el.textContent || "").toLowerCase()

// 🔥 SIGNALS
let signals = []

if(/(fee|charge|tax|shipping)/.test(text)) signals.push("strong")
if(/(not included|extra|additional|excluded)/.test(text)) signals.push("strong")

let confidence = calculateConfidence(signals)

// 🔥 only meaningful detection
if(signals.length >= 2){

issues.push({

id: "DP006",
category: "Transparency",
description: "Additional costs not clearly included in main price",

pattern:"Hidden Costs",
severity:"High",
confidence: confidence,

element: el,
selector: getSelector(el),

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Display total cost upfront to ensure transparency"

})

}

})

return issues
}



// Forced Continuity

function ruleForcedContinuity(doc){

let issues=[]
let text = (doc.body.textContent || "").toLowerCase()

// 🔥 SIGNALS
let signals = []

if(/free trial/.test(text)) signals.push("strong")
if(/(auto-renew|charged|subscription renews)/.test(text)) signals.push("strong")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 ONLY WHEN STRONG EVIDENCE
if(signals.length >= 2){

issues.push({

id: "DP007",
category: "Forced Action",
description: "Free trial leads to automatic paid subscription",

pattern:"Forced Continuity",
severity:"High",
confidence: confidence, 

element: doc.body,
selector: "body", // 

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Clearly inform users and provide easy opt-out before renewal"

})
}

return issues

}



// Roach Motel


function ruleRoachMotel(doc){

let issues=[]
let text = (doc.body.textContent || "").toLowerCase()

// 🔥 SIGNALS
let signals = []

if(/(contact support|call)/.test(text)) signals.push("medium")
if(/cancel/.test(text)) signals.push("strong")
if(/cannot cancel online/.test(text)) signals.push("strong")

let confidence = calculateConfidence(signals)

if(signals.length >= 2){

issues.push({

id: "DP008",
category: "Obstruction",
description: "Cancellation process is harder than signup",

pattern:"Roach Motel",
severity:"High",
confidence: confidence,

element: doc.body,
selector: "body",

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Allow users to cancel easily through the same channel"

})

}

return issues
}



// Disguised Ads

function ruleDisguisedAds(doc){

  let issues = []

  let elements = doc.querySelectorAll("a, button")

  elements.forEach((el, index) => {

    let text = (el.textContent || "").toLowerCase()
    let parentText = el.parentElement?.textContent.toLowerCase() || ""

    // 🔥 SIGNALS
    let signals = []

    if (/(download|install|play|get)/.test(text)) signals.push("strong")
    if (/(ad|advertisement|sponsored|promo)/.test(parentText)) signals.push("strong")

    // 🔥 CALCULATE CONFIDENCE
    let confidence = calculateConfidence(signals)

    // 🔥 ONLY STRONG MATCH
    if(signals.length >= 2){

      issues.push({

        id: "DP009",
        category: "Misdirection",
        description: "Advertisement disguised as a normal action button",

        pattern:"Disguised Ad",
        severity:"Medium",
        confidence: confidence, // ✅ dynamic

        element: el,
        selector: getSelector(el),
        tag: el.tagName,
        index: index, // 🔥 DO NOT REMOVE

        evidence:`Signals detected: ${signals.join(", ")}`,
        recommendation:"Clearly label advertisements"

      })
    }

  })

  return issues
}

// Privacy Zuckering

function rulePrivacyZuckering(doc){

let issues=[]
let text = (doc.body.textContent || "").toLowerCase()

// 🔥 SIGNALS
let signals = []

if(/(share your contacts|import friends)/.test(text)) signals.push("strong")
if(/(allow access|connect your account)/.test(text)) signals.push("medium")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 ONLY MEANINGFUL DETECTION
if(signals.length >= 1){

issues.push({

id: "DP010",
category: "Privacy",
description: "User is encouraged to share excessive personal data",

pattern:"Privacy Zuckering",
severity:"High",
confidence: confidence, // ✅ dynamic

element: doc.body,
selector: "body", // ✅ cleaner

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Request only essential data with clear purpose explanation"

})
}

return issues

}



// Misdirection UI
function ruleMisdirection(doc){

let issues=[]

doc.querySelectorAll("button").forEach(btn=>{

let attr = getAttributes(btn);

// 🔥 SIGNALS
let signals = []

if(attr.hidden) signals.push("strong")
if(attr.ariaHidden) signals.push("strong")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 ONLY WHEN SIGNAL EXISTS
if(signals.length > 0){

issues.push({
id: "DP011",
category: "Misdirection",
description: "Important action hidden",

pattern:"Hidden Action",
severity:"High",
confidence: confidence, // ✅ dynamic

element:btn,
selector: getSelector(btn),

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Do not hide important user choices"
});

}

});

return issues;

}


// Sneak into Basket


function ruleSneakIntoBasket(doc){

let issues=[]

doc.querySelectorAll('input[type="checkbox"]').forEach((box, index)=>{

let attr = getAttributes(box);
let label = box.closest("label")?.textContent.toLowerCase() || ""

// 🔥 SIGNALS
let signals = []

if(attr.checked) signals.push("strong")
if(!attr.disabled) signals.push("medium")
if(/(add|extra|include)/.test(label)) signals.push("strong")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 KEEP ORIGINAL DETECTION SAFE
if(attr.checked && /(add|extra|include)/.test(label)){

issues.push({

id: "DP012", 
category: "Forced Action",
description: "Additional item added without explicit user consent",

pattern:"Sneak into Basket",
severity:"High",
confidence: confidence, // ✅ dynamic

element:box,
selector: getSelector(box),
index: index,

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Do not add items automatically without explicit user consent"

})

}

})

return issues

}



// Fake Activity


function ruleFakeActivity(doc){

let issues=[]
let text = (doc.body.textContent || "").toLowerCase()

// 🔥 SIGNALS
let signals = []

if(/\d+\s+(people|users|customers)/.test(text)) signals.push("strong")
if(/(viewing|bought|purchased)/.test(text)) signals.push("medium")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

if(signals.length > 0){

issues.push({

id: "DP013",
category: "Social Proof",
description: "Potentially misleading activity indicators shown to users",

pattern:"Fake Activity",
severity:"Medium",
confidence: confidence,

element: doc.body,
selector: "body",

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Use real and verifiable user activity data only"

})

}

return issues

}



// ==========================================================================================

function ruleHiddenElements(doc){

let issues=[]

doc.querySelectorAll("button, a, input").forEach((el, index)=>{

let attr = getAttributes(el);

// 🔥 SIGNALS
let signals = []

if(attr.hidden) signals.push("strong")
if(attr.ariaHidden) signals.push("strong")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 KEEP ORIGINAL LOGIC SAFE
if(attr.hidden){

issues.push({
id: "DP014",
category: "Misdirection",
description: "Hidden interactive element",

pattern:"Hidden Element",
severity:"Medium",
confidence: confidence, // ✅ dynamic

element:el,
selector: getSelector(el),
index: index,

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Avoid hiding critical UI elements"
})

}

})

return issues
}





//Fake Buttons

function ruleFakeButtons(doc){

let issues=[]

doc.querySelectorAll("a").forEach((el, index)=>{

let attr = getAttributes(el);
let text = (el.textContent || "").toLowerCase()

// 🔥 SIGNALS
let signals = []

if(!attr.href) signals.push("strong")
if(/(click|continue|start|get|download)/.test(text)) signals.push("medium")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 KEEP ORIGINAL LOGIC SAFE
if(!attr.href){

issues.push({
id: "DP015",
category: "Misdirection",
description: "Anchor behaving like button without link",

pattern:"Fake Button",
severity:"Medium",
confidence: confidence, // ✅ dynamic

element:el,
selector: getSelector(el),
index: index,

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Ensure links have valid destinations"
})

}

})

return issues
}



//External Links

function ruleExternalLinks(doc){

let issues=[]

doc.querySelectorAll("a").forEach((el, index)=>{

let attr = getAttributes(el);
let text = (el.textContent || "").toLowerCase()

// 🔥 SIGNALS
let signals = []

if(attr.target === "_blank") signals.push("strong")
if(attr.href && attr.href.startsWith("http")) signals.push("strong")
if(!text.includes("external") && !text.includes("new tab")) signals.push("medium")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 KEEP ORIGINAL LOGIC SAFE
if(attr.target === "_blank" && attr.href && attr.href.startsWith("http")){

issues.push({
id: "DP016",
category: "Navigation Manipulation",
description: "Link opens in new tab",

pattern:"External Redirect",
severity:"Low",
confidence: confidence, // ✅ dynamic

element:el,
selector: getSelector(el),
index: index,

evidence:`Signals detected: ${signals.join(", ")}`,
recommendation:"Inform users before redirecting"
})

}

})

return issues
}




//Button Imbalance

function ruleButtonImbalance(doc){

let issues=[]

doc.querySelectorAll("button").forEach(btn => {

let ctx = getContext(btn);

let buttons = ctx.siblings.filter(el => el.tagName === "BUTTON");

if(buttons.length < 2) return;

let accept = null;
let decline = null;

buttons.forEach(b => {
  let text = (b.textContent || "").toLowerCase();

  if(text.includes("accept")) accept = b;
  if(text.includes("decline") || text.includes("reject")) decline = b;
});

if(accept && decline){

let aStyle = window.getComputedStyle(accept);
let dStyle = window.getComputedStyle(decline);

let aSize = parseFloat(aStyle.fontSize) || 0;
let dSize = parseFloat(dStyle.fontSize) || 0;

let aOpacity = parseFloat(aStyle.opacity) || 1;
let dOpacity = parseFloat(dStyle.opacity) || 1;

// 🔥 SIGNALS
let signals = []

if(aSize > dSize) signals.push("strong")
if(dOpacity < 0.6) signals.push("medium")

// 🔥 CALCULATE CONFIDENCE
let confidence = calculateConfidence(signals)

// 🔥 KEEP ORIGINAL LOGIC SAFE
if(aSize > dSize){

issues.push({
id: "DP017",
category: "Misdirection",
description: "Accept button more prominent than decline",

pattern:"Button Imbalance",
severity:"High",
confidence: confidence, // ✅ dynamic

element:accept,
selector: getSelector(accept),

evidence:`Accept: ${aSize}px vs Decline: ${dSize}px, opacity: ${dOpacity}`,
recommendation:"Ensure equal prominence for user choices"
});

}

}

});

return issues;
}





function ruleFormConsent(doc){

let issues=[]

doc.querySelectorAll("form").forEach(form => {

let checkboxes = form.querySelectorAll('input[type="checkbox"]');
let submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');

// 🔥 find reject option
let hasReject = false;
form.querySelectorAll("button").forEach(btn=>{
  let text = (btn.textContent || "").toLowerCase();
  if(text.includes("reject") || text.includes("decline") || text.includes("no")){
    hasReject = true;
  }
});

checkboxes.forEach(box => {

let attr = getAttributes(box);

// 🔥 MULTI-SIGNAL SCORING
let score = 0;

if(attr.checked) score += 0.4;
if(submitBtn) score += 0.2;
if(box.required) score += 0.2;
if(!hasReject) score += 0.2;

// 🔥 Only flag if meaningful
if(score >= 0.5){

issues.push({

id: "DP018",
category: "Forced Action",
description: "Consent checkbox tied to form submission (multi-signal)",

pattern:"Forced Consent",
severity:"High",

confidence: Math.min(1, score), // 🔥 dynamic

element: box,
selector: getSelector(box),

evidence: `Signals detected: ${
  [
    attr.checked ? "pre-selected" : "",
    submitBtn ? "submit button present" : "",
    box.required ? "required field" : "",
    !hasReject ? "no reject option" : ""
  ].filter(Boolean).join(", ")
}`,

recommendation:"Do not force consent; require explicit user action"

});

}

});

});

return issues;
}



function ruleModalManipulation(doc){

let issues=[]

console.log("🚀 Modal rule running");

doc.querySelectorAll("div").forEach(container => {

let buttons = container.querySelectorAll("button");

if(buttons.length < 2) return;

// 🔥 detect modal-like container (simple + reliable)
let text = container.innerText.toLowerCase();

let isModalLike =
  text.includes("accept") &&
  (text.includes("decline") || text.includes("reject"));

if(!isModalLike) return;

let accept = null;
let decline = null;

buttons.forEach(b => {
  let t = (b.textContent || "").toLowerCase();

  if(t.includes("accept")) accept = b;
  if(t.includes("decline") || t.includes("reject")) decline = b;
});

if(accept && decline){

// 🔥 USE INLINE STYLE (reliable)
let aSize = parseFloat(accept.style.fontSize) || 12;
let dSize = parseFloat(decline.style.fontSize) || 12;

let dOpacity = parseFloat(decline.style.opacity || 1);

console.log("MODAL CHECK:", aSize, dSize, dOpacity);

// 🔥 condition
if(aSize > dSize || dOpacity < 0.6){

issues.push({
id: "DP019",
category: "Misdirection",
description: "Manipulative design inside modal",

pattern:"Modal Manipulation",
severity:"High",
confidence:0.93,
element:accept,
selector: getSelector(accept),
evidence:"Accept emphasized or decline de-emphasized inside modal",
recommendation:"Ensure equal visibility of choices in modal"
});

}

}

});

return issues;
}



// ================= MASTER SCAN FUNCTION =================

function scanAllRules(doc){
let results = [
...rulePrecheckedCheckbox(doc),
...ruleMissingReject(doc),
...ruleFakeScarcity(doc),
...ruleCountdownTimer(doc),
...ruleConfirmShaming(doc),
...ruleHiddenCosts(doc),
...ruleForcedContinuity(doc),
...ruleRoachMotel(doc),
...ruleDisguisedAds(doc),
...rulePrivacyZuckering(doc),
...ruleMisdirection(doc),
...ruleSneakIntoBasket(doc),
...ruleFakeActivity(doc),
...ruleHiddenElements(doc),
...ruleFakeButtons(doc),
...ruleExternalLinks(doc),
...ruleButtonImbalance(doc),
...ruleFormConsent(doc),
...ruleModalManipulation(doc),
]



// ✅ REMOVE DUPLICATES BY PATTERN
let unique = []
let seen = new Set()

results.forEach(r=>{
if(!seen.has(r.pattern)){
seen.add(r.pattern)
unique.push(r)
}
})

// 🔥 Confidence Boost
if(unique.length > 3){
unique.forEach(r=>{
r.confidence = Math.min(1, r.confidence + 0.05)
})
}

return unique
}
