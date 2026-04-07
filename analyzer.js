function analyzeDOM(doc){

let findings=[]

findings.push(...rulePrecheckedCheckbox(doc))
findings.push(...ruleMissingReject(doc))
findings.push(...ruleConfirmShaming(doc))

return findings

}
