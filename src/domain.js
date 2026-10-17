/**
 * Domain model and safe deterministic comparison engine.
 * DISCLAIMER: This is a document-diff demo with FICTITIOUS medications,
 * not a clinical medication reconciliation system.
 */
export const KINDS = {
  changed: { label: '资料有调整', icon: 'refresh', tone: 'amber', short: '调整' },
  explicit_added: { label: '新资料出现', icon: 'plus-circle', tone: 'blue', short: '新增' },
  explicit_stopped: { label: '新资料明确提及停止', icon: 'minus-circle', tone: 'amber', short: '注明停止' },
  unchanged: { label: '已比对字段未见差异', icon: 'check', tone: 'neutral', short: '无变化' },
  missing_in_new: { label: '新资料未提及', icon: 'help-circle', tone: 'red', short: '未提及' },
  ambiguous: { label: '需要进一步核实', icon: 'alert-circle', tone: 'red', short: '待核实' }
};
const clean = v => (v == null ? '' : String(v).trim().replace(/\s+/g, ' ').normalize('NFKC'));
const fldLabels = {strengthText:'规格',doseText:'一次数量',frequencyText:'次数安排',timeText:'时间',startDate:'开始日期',endDate:'结束日期'};
const uid=()=>'diff-'+Math.random().toString(36).slice(2,8);
const evidenceOf=(e)=> e?.evidence?.length?e.evidence:[{sourceId:e?.sourceId||'unknown',rawSpan:'原文待核对'}];
export function compareMedications(oldEntries=[], newEntries=[], options={}) {
 const used = new Set(), results=[];
 for(const old of oldEntries){
  // Match strictly by stable fixture key (same fictitious drug). Never assume similar names/specs same drug.
  const match=newEntries.find(n=>!used.has(n.id)&&n.matchKey&&old.matchKey&&n.matchKey===old.matchKey);
  if(!match){
   results.push(make('missing_in_new',old,null,[],['new_not_mentioned'],true,'新药单没提到，不能确定停用。'));
   continue;
  }
  used.add(match.id);
  const changes=Object.keys(fldLabels).filter(k=>clean(old[k])!==clean(match[k])).map(k=>({field:fldLabels[k],oldText:old[k]??null,newText:match[k]??null}));
  let kind='unchanged', reasons=[], needs=false;
  const missingCritical=(!clean(match.displayName)||!clean(match.timeText)||!clean(match.doseText));
  if(old.matchKey && match.matchKey && (clean(old.strengthText)&&clean(match.strengthText)&&clean(old.strengthText)!==clean(match.strengthText))) {
    kind='ambiguous';reasons.push('strength_conflict');needs=true;
  }
  else if((match.uncertainFields||[]).length||missingCritical||options.conflict){kind='ambiguous';reasons.push('uncertain_or_incomplete');needs=true;}
  else if(match.explicitAction==='stop' && (match.evidence||[]).some(x=>/停用|停止|停服/.test(x.rawSpan||''))){kind='explicit_stopped';reasons.push('explicit_source_stop');needs=true;}
  else if(changes.length){kind='changed';reasons.push('document_field_changed');needs=true;}
  else {kind='unchanged';reasons.push('compared_fields_same');}
  const explain = kind==='ambiguous' ? '这里不清楚，先核对一下。'
      :kind==='explicit_stopped'?'新版资料注明停止，请核对。'
      :kind==='changed'?'这项安排发生变化。'
      :'这项安排没有变化。';
  results.push(make(kind,old,match,changes,reasons,needs,explain));
 }
 for(const n of newEntries){if(used.has(n.id))continue;
  let kind=(!clean(n.displayName)||!clean(n.doseText)||(n.uncertainFields||[]).length||options.newDocumentCompleteness!=='complete_list')?'ambiguous':'explicit_added';
  results.push(make(kind,null,n,[],[kind==='ambiguous'?'incomplete_or_unmatched':'new_entry'],true,
    kind==='ambiguous'?'新资料出现一项无法确定身份或资料完整性的记录，需要继续核实。':'新药单多了这一项，请核对。'));
 }
 if(options.effectiveDateMissing || options.sourceConflict) {
  results.push({id:'diff-source-'+(options.sourceConflict?'conflict':'date'),kind:'ambiguous',displayName: '资料来源 / 日期',oldEntryId:null,newEntryId:null,fieldChanges:[],sourceEvidence:[],requiresProfessionalClarification:true,reasonCodes:[options.sourceConflict?'source_conflict':'effective_date_missing'],elderExplanation:'资料日期不清楚，请核对。'});
 }
 return results;
}
function make(kind,old,nw,changes,reasons,needs,elderExplanation){return {id:`diff-${old?.matchKey||nw?.matchKey||uid()}`,kind,displayName:nw?.displayName||old?.displayName||'未知项目',oldEntryId:old?.id||null,newEntryId:nw?.id||null,oldEntry:old||null,newEntry:nw||null,fieldChanges:changes,sourceEvidence:[...evidenceOf(old),...evidenceOf(nw)].filter(x=>x.sourceId!=='unknown'),requiresProfessionalClarification:needs,reasonCodes:reasons,elderExplanation};}
export function statsOf(differences=[]) {return {changes:differences.filter(x=>x.kind==='changed'||x.kind==='explicit_added'||x.kind==='explicit_stopped').length, questions:differences.filter(x=>x.requiresProfessionalClarification).length, unchanged:differences.filter(x=>x.kind==='unchanged').length, total:differences.length};}
export function unresolvedQuestions(diffs=[]){return diffs.filter(x=>x.requiresProfessionalClarification).map(d=>({id:d.id,name:d.displayName,text:d.kind==='missing_in_new'?`旧记录有“${d.displayName}”，新资料没有提到。请确认是否继续。`:d.kind==='ambiguous'?`“${d.displayName}”的资料不完整或互相矛盾，请确认正确记录和生效时间。`:`关于“${d.displayName}”，新旧资料存在差异。请确认哪个版本及何时适用。`}));}
export const FIXTURES = {
 normal:{name:'01 · 常规变化',sub:'时间调整、新项目与未变化项',tone:'green',old:[med('A','模拟药A','早上','一份','每天'),med('C','模拟药C','晚上','一份','每天')],new:[med('A','模拟药A','晚上','一份','每天'),med('C','模拟药C','晚上','一份','每天'),med('D','模拟药D','中午','一份','每天','start')],complete:'complete_list'},
 missing:{name:'02 · 新资料遗漏',sub:'旧记录有药B，新文件未提及',tone:'amber',old:[med('A','模拟药A','早上','一份','每天'),med('B','模拟药B','晚上','一份','每天')],new:[med('A','模拟药A','早上','一份','每天')],complete:'partial'},
 conflict:{name:'03 · 信息冲突',sub:'规格和时间不一致',tone:'red',old:[med('A','模拟药A','早上','一份','每天','', '1单位')],new:[med('A','模拟药A','晚上','一份','每天','','2单位')],complete:'unknown',sourceConflict:true},
 unreadable:{name:'04 · 识别不清',sub:'资料有无法辨认的字段',tone:'red',old:[med('A','模拟药A','早上','一份','每天')],new:[{...med('A','模拟药A',null,'一份','每天'),uncertainFields:['timeText']}],complete:'unknown'},
 nohelp:{name:'05 · 尚无协助',sub:'没有准备旧版资料',tone:'amber',old:[],new:[],complete:'unknown',startEmpty:true},
 speechOff:{name:'06 · 语音关闭',sub:'完全通过按钮与字幕完成',tone:'blue',old:[med('A','模拟药A','早上','一份','每天')],new:[med('A','模拟药A','晚上','一份','每天')],complete:'complete_list',speechOff:true},
 aiError:{name:'07 · AI 不可用',sub:'展示失败和手录替代路径',tone:'red',old:[],new:[],complete:'unknown',aiError:true,startEmpty:true},
 replay:{name:'08 · 历史回看',sub:'完整案例回看示例',tone:'green',old:[med('A','模拟药A','早上','一份','每天')],new:[med('A','模拟药A','晚上','一份','每天')],complete:'complete_list',preComplete:true}
};
function med(key,name,time,dose,frequency='每天',explicitAction=null,strength='模拟规格'){return {id:`${key}-${time==='早上'?'old':'entry'}-${Math.random().toString(36).slice(2,4)}`,matchKey:key,displayName:name,form:'模拟剂型',strengthText:strength,doseText:dose,frequencyText:frequency,timeText:time,startDate:null,endDate:null,explicitAction,evidence:[{sourceId:'',rawSpan:`${name}：${frequency}，${time||'时间不清'}，${dose}`}],transcriptionStatus:'unreviewed',uncertainFields:[]};}
export function createCase(scenario='normal'){
 const f=FIXTURES[scenario]||FIXTURES.normal;const n=Date.now(),id=`case-${n}`;
 const older=f.old.map((e,i)=>({...e,id:`old-${i}-${id}`,sourceId:`old-${id}`,evidence:[{sourceId:`old-${id}`,rawSpan:e.evidence[0].rawSpan}]}));
 const newer=f.new.map((e,i)=>({...e,id:`new-${i}-${id}`,sourceId:`new-${id}`,evidence:[{sourceId:`new-${id}`,rawSpan:e.evidence[0].rawSpan}]}));
 const docs = f.startEmpty?[]:[
 {id:`old-${id}`,sourceKind:'prior_confirmed_record',label:'旧版已记录安排（虚构）',authoredDate:'2026-10-01',effectiveDate:'2026-10-01',completeness:'complete_list',rawText:older.map(e=>e.evidence[0].rawSpan).join('\n'),extractionMode:'mock_fixture',demoData:true},
 {id:`new-${id}`,sourceKind:'new_written_instruction',label:'新版书面资料（虚构）',authoredDate:f.sourceConflict?null:'2026-10-16',effectiveDate:f.sourceConflict?null:'2026-10-16',completeness:f.complete,rawText:newer.map(e=>e.evidence[0].rawSpan).join('\n'),extractionMode:'mock_fixture',demoData:true}];
 const entries=[...older,...newer].map(e=>({...e,transcriptionStatus:f.preComplete?'transcription_checked':'unreviewed'}));
 const diffs=f.preComplete?compareMedications(older,newer,{newDocumentCompleteness:f.complete}):[];
 return {id,scenario,demoData:true,workflowStatus:f.preComplete?'SUMMARY_READY':f.startEmpty?'SOURCES_PENDING':'TRANSCRIPTION_REVIEW',documents:docs,medications:entries,differences:diffs,clinicalStatus:'not_verified_by_professional',viewedDifferenceIds:f.preComplete?diffs.map(d=>d.id):[],createdAt:new Date(n).toISOString(),updatedAt:new Date(n).toISOString(),notes:[],error:f.aiError?'未配置真实 AI 服务。您可以使用手动录入或主动加载虚构案例。':null};
}
export function getOldNew(c){return {old:c.medications.filter(m=>m.sourceId.startsWith('old-')),newer:c.medications.filter(m=>m.sourceId.startsWith('new-'))};}
export function allTranscriptionsChecked(c){return c.medications.length>0&&c.medications.every(x=>x.transcriptionStatus==='transcription_checked' || x.transcriptionStatus==='needs_source_review');}
export function runCompare(c){const {old,newer}=getOldNew(c);if(!old.length||!newer.length) return {error:'缺少旧资料或新资料，无法比较。'};if(!allTranscriptionsChecked(c))return {error:'请先核对各条资料的转录文本。'};
const nd=c.documents.find(d=>d.sourceKind==='new_written_instruction');const changed=compareMedications(old,newer,{newDocumentCompleteness:nd?.completeness||'unknown',effectiveDateMissing:!nd?.effectiveDate,sourceConflict:c.scenario==='conflict'});
return {differences:changed};}
