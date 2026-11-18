const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const webcrypto=require('node:crypto').webcrypto;
const directory=require('node:path').resolve(__dirname,'../dist')+require('node:path').sep;
let assertions=0;
function check(value,message){assert(value,message);assertions++}
function setup(saved=null){
  const elements=new Map(),listeners={},storage=new Map();
  if(saved)storage.set('analystpath.workspace.v1',saved);
  const element=selector=>{
    if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',value:'',open:false,dataset:{},elements:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},showModal(){this.open=true},close(){this.open=false},focus(){},checkValidity(){return true},reportValidity(){return true}});
    return elements.get(selector);
  };
  const context={console,URL,Date,Intl,crypto:webcrypto,setTimeout(){return 1},clearTimeout(){},confirm(){return true},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{hash:''},history:{replaceState(){}},
    document:{querySelector:element,addEventListener:(type,fn)=>listeners[type]=fn},window:{addEventListener(){},scrollTo(){}},navigator:{},
    FormData:class{constructor(form){this.values=Object.entries(form.data).map(([k,v])=>[k,String(v??'')])} [Symbol.iterator](){return this.values[Symbol.iterator]()}}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(directory+'data.js','utf8'),context);
  vm.runInContext(fs.readFileSync(directory+'data-sources.js','utf8'),context);
  vm.runInContext(fs.readFileSync(directory+'data-directory.js','utf8'),context);
  vm.runInContext(fs.readFileSync(directory+'app.js','utf8'),context);
  const run=code=>vm.runInContext(code,context);
  function form(data,checks={}){const controls=Object.fromEntries(Object.keys(data).map(k=>[k,{value:String(data[k]??''),focus(){}}]));Object.entries(checks).forEach(([k,v])=>controls[k]={checked:v,focus(){}});const f={data,elements:controls,checkValidity(){return true},reportValidity(){return true}};elements.set('#record-form',f);context.testForm=f;return f}
  return{context,run,element,listeners,storage,form};
}
const r=setup(),{run,form,element,listeners}=r;
for(const name of ['dashboard','learning','resources','dataSources','projects','opportunities','applications','evidence','roles','templates','searchPage']){
  const html=run(name+'()');check(typeof html==='string'&&html.length>100,name+' renders empty state');
}
check(run('totalDone()')===0,'No invented completed learning');
check(run('state.applications.length')===0,'No invented applications');
check(run('btn("Cancel","close")').includes('type="button"'),'Helper buttons never submit forms');
for(const call of ['openLog()','openProject("operations-kpi")','openLead()','openApplication()','openCertificate()','openProfile()','openTemplate("readme")','openBackup()']){
  run(call);check(element('#modal-content').innerHTML.includes('modal-title'),call+' opens labelled modal');
}
run('openProfile()');form({name:'Asha',degree:'BA',role:'Operations Supervisor',relocation:'Across India',weeklyHours:'4.5'});run('saveRecord(testForm)');
check(run('state.profile.name')==='Asha'&&run('state.profile.weeklyHours')===4.5,'Preferences saved with numeric goal');
run('openLog()');form({title:'SQL joins',date:run('today()'),area:'SQL',minutes:'45',url:'https://example.org/query',notes:'Compared row counts',next:'Practise LEFT JOIN'});run('saveRecord(testForm)');
check(run('state.logs.length')===1&&run('state.logs[0].minutes')===45,'Create evidence log');
const logId=run('state.logs[0].id');run('openLog('+JSON.stringify(logId)+')');form({title:'SQL joins updated',date:run('today()'),area:'SQL',minutes:'50',url:'https://example.org/query',notes:'Checked NULLs too',next:'Practise CTE'});run('saveRecord(testForm)');
check(run('state.logs.length')===1&&run('state.logs[0].title')==='SQL joins updated','Edit evidence without duplicate');
run('openLog()');form({title:'Invalid link',date:run('today()'),area:'SQL',minutes:'10',url:'javascript:alert(1)',notes:'',next:''});run('saveRecord(testForm)');
check(run('state.logs.length')===1,'Reject dangerous evidence URL');
run('openLead()');form({title:'MIS Executive',organisation:'Example employer',location:'Pune',url:'https://example.org/notice',role:'Data Analyst',reference:'REF-1',deadline:'2027-01-01',checked:run('today()'),fee:'0',eligibility:'Eligible',notes:'Any graduate stated in example',next:'Prepare CV'},Object.fromEntries(['official','eligible','terms','noagent'].map(k=>[k,true])));run('saveRecord(testForm)');
check(run('state.leads.length')===1&&run('verified(state.leads[0])'),'Save checked ₹0 opportunity');
run('openApplication(null,state.leads[0])');form({title:'MIS Executive',organisation:'Example employer',location:'Pune',url:'https://example.org/notice',status:'Saved',applied:'',followup:'2026-12-01',deadline:'2027-01-01',cv:'CV v1',notes:'Eligible',next:'Tailor CV'});run('saveRecord(testForm)');
check(run('state.applications.length')===1&&run('state.applications[0].leadId===state.leads[0].id'),'Create application linked to lead');
const appId=run('state.applications[0].id');run('openApplication('+JSON.stringify(appId)+')');form({title:'MIS Executive',organisation:'Example employer',location:'Pune',url:'https://example.org/notice',status:'Applied',applied:'',followup:'',deadline:'',cv:'CV v2',notes:'',next:''});run('saveRecord(testForm)');
check(run('state.applications[0].status')==='Saved','Applied status requires real applied date');
form({title:'MIS Executive',organisation:'Example employer',location:'Pune',url:'https://example.org/notice',status:'Applied',applied:run('today()'),followup:'2026-12-01',deadline:'',cv:'CV v2',notes:'',next:'Follow up'});run('saveRecord(testForm)');
check(run('state.applications[0].status')==='Applied'&&run('state.applications[0].history.length')===2,'Applied change stores status history');
listeners.change({target:{dataset:{applicationStatus:appId},value:'Interview'}});
check(run('state.applications[0].status')==='Interview'&&run('state.applications[0].history.length')===3,'Status control updates persisted history');
listeners.change({target:{dataset:{task:'sql-1'},checked:true}});
check(run('totalDone()')===1,'Learning checklist persists real progress');
listeners.change({target:{dataset:{confidence:'sql'},value:'Independent practice'}});
check(run('state.skills.sql')==='Independent practice','Skill self assessment saved');
listeners.change({target:{dataset:{week:'practice'},checked:true}});
check(run('state.week[weekStart()+"practice"]')===true,'Weekly focus check saved under week');
run('openProject("operations-kpi")');form({status:'Building',url:'https://example.org/workbook',next:'Build pivots'},{'deliverable-0':true,'deliverable-1':true,'deliverable-2':false,'deliverable-3':false});run('saveRecord(testForm)');
check(run('state.projects["operations-kpi"].status')==='Building'&&run('state.projects["operations-kpi"].checks[1]')===true,'Project status, next step and deliverables saved');
run('openCertificate()');form({title:'Intro to SQL',provider:'Kaggle',date:run('today()'),type:'Course completion certificate',url:'https://example.org/certificate',notes:'Practice joins next'});run('saveRecord(testForm)');
check(run('state.certificates.length')===1,'Earned certificate saved');
for(const name of ['dashboard','learning','resources','dataSources','projects','opportunities','applications','evidence','roles','templates','searchPage']){
  const html=run(name+'()');check(typeof html==='string'&&html.length>100,name+' renders populated state');
}
run('appView="board"');check(run('applications()').includes('kanban'),'Application board renders populated cards');
run('query="MIS"');check(run('searchPage()').includes('MIS Executive'),'Workspace search includes application/lead records');
run('openProjectBrief()');form({title:'My stock analysis',description:'Analyse a synthetic stock table',tools:'Excel, SQL',deliverables:'Dataset\nChecked query\nREADME',estimated:'3 sessions'});run('saveRecord(testForm)');
check(run('state.customProjects.length')===1&&run('projectList().length')===4,'Create custom project');
const customId=run('state.customProjects[0].id');
run('openProject('+JSON.stringify(customId)+')');form({status:'Building',url:'https://example.org/stock',next:'Validate totals'},{'deliverable-0':true,'deliverable-1':true,'deliverable-2':false});run('saveRecord(testForm)');
check(run('state.projects['+JSON.stringify(customId)+'].checks[1]')===true,'Track custom project deliverables');
run('openProjectBrief('+JSON.stringify(customId)+')');form({title:'My stock analysis v2',description:'Document assumptions too',tools:'Excel, SQL',deliverables:'Dataset\nChecked query\nREADME',estimated:'4 sessions'});run('saveRecord(testForm)');
check(run('state.customProjects.length')===1&&run('state.customProjects[0].title')==='My stock analysis v2','Edit custom project without duplicate');
check(run('state.projects['+JSON.stringify(customId)+'].checks[1]')===true,'Unchanged deliverables preserve checklist');
run('openProjectBrief('+JSON.stringify(customId)+')');form({title:'My stock analysis v2',description:'Document assumptions too',tools:'Excel, SQL',deliverables:'Data dictionary\nChecked query\nREADME',estimated:'4 sessions'});run('saveRecord(testForm)');
check(run('Object.keys(state.projects['+JSON.stringify(customId)+'].checks).length')===0,'Changed deliverables reset custom checklist');
run('openProject('+JSON.stringify(customId)+')');form({status:'Complete',url:'https://example.org/stock',next:'Review limitations'},{'deliverable-0':true,'deliverable-1':true,'deliverable-2':true});run('saveRecord(testForm)');
check(run('projects()').includes('My stock analysis v2'),'Custom projects appear in project view');
run('query="stock"');check(run('searchPage()').includes('My stock analysis v2'),'Custom project appears in search');
const serialized=run('JSON.stringify(state)');
check(run('JSON.stringify(validateBackup(JSON.parse(JSON.stringify(state)))).includes("SQL joins updated")'),'Backup validates and retains evidence');
const restored=setup(serialized);
check(restored.run('state.logs[0].title')==='SQL joins updated'&&restored.run('state.tasks["sql-1"]')===true,'Saved browser state survives reload');
check(restored.run('state.projects["operations-kpi"].checks[1]')===true&&restored.run('state.applications[0].history.length')===3,'Project/history survives reload');
check(restored.run('state.customProjects.length')===1&&restored.run('state.projects['+JSON.stringify(customId)+'].status')==='Complete','Custom project and status survive reload');
run('globalThis.cleanBackup=validateBackup(JSON.parse(JSON.stringify(state)))');
check(run('cleanBackup.customProjects[0].title')==='My stock analysis v2'&&run('cleanBackup.projects['+JSON.stringify(customId)+'].checks[2]')===true,'Custom project brief and deliverables survive validated backup');
check(run('safeUrl("javascript:alert(1)")')==='#'&&run('safeUrl("data:text/html,test")')==='#','Reject executable URL schemes');
run('state.logs[0].title="<img onerror=alert(1)>";state.logs[0].notes="<script>bad()</script>";state.logs[0].url="javascript:alert(1)";');
const evidence=run('evidence()');check(!evidence.includes('<script>bad')&&!evidence.includes('<img onerror')&&!evidence.includes('href="javascript:'),'Escape user content and unsafe links in markup');
run('download=(name,data,type)=>{globalThis.testDownload={name,data,type}};state.applications[0].title="=SUM(1,2)";csvExport()');
check(run('testDownload.data').includes('"\'=SUM(1,2)"'),'CSV prevents spreadsheet formula execution');
check(run('testDownload.data').includes('CV v2'),'CSV exports recorded application evidence version');
let rejected=false;try{run('validateBackup({version:2})')}catch{rejected=true}check(rejected,'Invalid backup version rejected');
run('openLog('+JSON.stringify(logId)+');deleteRecord()');check(run('state.logs.length')===0,'Explicit record deletion works');
run('openProjectBrief('+JSON.stringify(customId)+');deleteRecord()');check(run('state.customProjects.length')===0&&run('state.projects['+JSON.stringify(customId)+']')===undefined,'Deleting custom brief removes its progress');
// A catalogue may contain both open downloads and mixed-access repositories.
// Enforce the documented access boundaries and exercise the user-facing filters.
const catalogue=r.context.window.DATA_DIRECTORY;
check(catalogue.sources.length>=60&&catalogue.categories.length>=12,'Broad dataset directory is available');
check(new Set(catalogue.sources.map(s=>s.id)).size===catalogue.sources.length,'Source identifiers are unique');
check(catalogue.sources.every(s=>/^[a-z0-9-]+$/.test(s.id)),'Source identifiers are safe in links and attributes');
check(catalogue.sources.every(s=>['name','description','projectIdea','terms','evidenceNote','checkedOn'].every(k=>typeof s[k]==='string'&&s[k].trim())),'Every source includes useful access, project and verification notes');
check(catalogue.sources.every(s=>[s.url,s.evidenceUrl].every(u=>new URL(u).protocol==='https:')),'Provider and evidence links use HTTPS');
check(catalogue.sources.every(s=>catalogue.categories.includes(s.category)&&s.formats.length&&s.topics.length),'Every source has a supported subject, format and topics');
check(catalogue.sources.every(s=>['No account','Free account / key','Varies by dataset'].includes(s.access)),'Account labels use the documented choices');
check(!catalogue.sources.some(s=>s.id==='google-dataset-search')&&catalogue.discoveryTools.some(s=>s.id==='google-dataset-search'),'Mixed-access dataset search is separate from free source entries');
const sourceStateBefore=run('JSON.stringify(state)');
run('dataSourceFilters=initialDataSourceFilters()');
check(run('findDataSources().length')===catalogue.sources.length,'Unfiltered view contains the entire source directory');
listeners.input({target:{id:'data-source-search',value:'india'}});
check(run('findDataSources().some(s=>s.id==="data-gov-in")')&&element('#data-source-results').innerHTML.includes('Open Government Data India'),'Topic input filters results without replacing the search field');
run('dataSourceFilters=initialDataSourceFilters()');
listeners.change({target:{dataset:{dataFilter:'category'},value:'Sports'}});
check(run('findDataSources().length')>=2&&run('findDataSources().every(s=>s.category==="Sports")'),'Subject filter selects sports sources');
listeners.change({target:{dataset:{dataFilter:'format'},value:'JSON'}});
listeners.change({target:{dataset:{dataFilter:'access'},value:'No account'}});
check(run('findDataSources().every(s=>s.formats.includes("JSON")&&s.access==="No account")'),'Subject, format and account filters combine');
run('dataSourceFilters.query="no-matching-source-zzzz"');
check(run('findDataSources().length')===0&&run('dataSourceResults()').includes('No sources match these filters'),'Empty results explain how to recover');
run('beginnerDataSources()');
check(run('findDataSources().length')>0&&run('findDataSources().every(s=>s.level==="Beginner")'),'Beginner shortcut returns only beginner sources');
run('resetDataSourceFilters()');
check(run('findDataSources().length')===catalogue.sources.length&&run('JSON.stringify(state)')===sourceStateBefore,'Resetting filters preserves all tracker records');
run('query="delivery"');
check(run('searchPage()').includes('data-source-link="olist-ecommerce"'),'Workspace search links directly to dataset sources');
const projectCountBefore=run('state.customProjects.length');
run('openDataProject("ms-financial")');
check(element('#modal-content').innerHTML.includes('sample-financial-download')&&element('#modal-content').innerHTML.includes('Source, licence, access date and data dictionary'),'Dataset project brief carries its source URL and evidence checklist');
check(run('state.customProjects.length')===projectCountBefore,'Opening a dataset brief creates no saved project until explicit save');
run('openDataProject("chinook")');
check(element('#modal-content').innerHTML.includes('value="SQL"')&&element('#modal-content').innerHTML.includes('Chinook'),'SQL sample projects suggest the matching SQL tool');
run('dataSourceFilters={...initialDataSourceFilters(),category:"Sports"};exportDataSources()');
const directoryCsv=run('testDownload.data');
check(directoryCsv.startsWith('\uFEFF"Source","Subject"')&&directoryCsv.includes('Cricsheet')&&!directoryCsv.includes('Microsoft Financial Sample'),'CSV exports the filtered directory with headers and source details');
check(run('testDownload.name').startsWith('analyst-path-data-sources-'),'Directory CSV has its own descriptive filename');
run('resetDataSourceFilters()');
console.log(`PASS: ${assertions} checks. Mocked DOM/Node verification only; browser rendering and layout need separate checks.`);
