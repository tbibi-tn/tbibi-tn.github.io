/* Tbibi — reference lists (medications, lab tests, imaging) and demo data generator */
/* ---------- Reference lists ---------- */
const ANALYSES = ["NFS","VS","CRP","Glycémie à jeun","HbA1c","Cholestérol total","HDL / LDL","Triglycérides","Urée","Créatinine","Acide urique","ASAT / ALAT","Gamma GT","Bilirubine","TSH","T4 libre","Ionogramme sanguin","Ferritine","Fer sérique","Vitamine D","Vitamine B12","TP / INR","Groupe sanguin / Rh","β-HCG","PSA","ECBU","Protéinurie 24h","Sérologie hépatite B","Sérologie hépatite C","HIV","Sérologie toxoplasmose","Sérologie rubéole","ASLO","Calcémie","Phosphatases alcalines","Microalbuminurie"];
const IMAGERIE = ["Radio thorax face","Radio rachis lombaire","Radio rachis cervical","Radio genou","Radio sinus (Blondeau)","Radio bassin","Échographie abdominale","Échographie pelvienne","Échographie thyroïdienne","Échographie rénale","Écho-doppler veineux MI","Échographie obstétricale","Mammographie","ECG","Échocardiographie","Scanner cérébral","Scanner thoracique","IRM lombaire","Spirométrie","Fond d'œil"];
const DIAG_COMMON = ["Grippe","Rhinopharyngite","Angine","Sinusite aiguë","Bronchite aiguë","Otite moyenne aiguë","Gastro-entérite","Infection urinaire","HTA","Diabète type 2","Lombalgie","Gastrite","Réaction allergique","Dermatite","Asthme","Céphalée","Hypothyroïdie","Anémie ferriprive","Conjonctivite","Arthrose du genou","Dyslipidémie","Anxiété","Cervicalgie","Pharyngite","Colopathie fonctionnelle"];

const MEDS_SEED = [
 ["Doliprane 1000 mg","Paracétamol","Antalgique","Comprimé",3.2,1,["1 cp x 3/j","1 cp si douleur, max 3/j"]],
 ["Doliprane 500 mg","Paracétamol","Antalgique","Comprimé",2.1,1,["1 cp x 3/j"]],
 ["Efferalgan 1 g","Paracétamol","Antalgique","Cp effervescent",3.9,1,["1 cp x 3/j"]],
 ["Augmentin 1 g","Amoxicilline + Ac. clavulanique","Antibiotique - Pénicilline","Comprimé",14.6,1,["1 cp x 2/j pendant 7 jours","1 cp x 3/j"]],
 ["Clamoxyl 1 g","Amoxicilline","Antibiotique - Pénicilline","Comprimé",8.4,1,["1 cp x 2/j pendant 6 jours"]],
 ["Amoxil 500 mg","Amoxicilline","Antibiotique - Pénicilline","Gélule",6.2,1,["2 gél x 2/j"]],
 ["Zithromax 250 mg","Azithromycine","Antibiotique - Macrolide","Comprimé",12.9,1,["2 cp le 1er jour puis 1 cp/j pendant 4 jours"]],
 ["Ciproxine 500 mg","Ciprofloxacine","Antibiotique - Quinolone","Comprimé",11.4,1,["1 cp x 2/j"]],
 ["Oflocet 200 mg","Ofloxacine","Antibiotique - Quinolone","Comprimé",9.8,1,["1 cp x 2/j"]],
 ["Bactrim Forte","Sulfaméthoxazole + Triméthoprime","Antibiotique - Sulfamide","Comprimé",4.5,1,["1 cp x 2/j"]],
 ["Flagyl 500 mg","Métronidazole","Antiparasitaire / Antibiotique","Comprimé",5.3,1,["1 cp x 3/j"]],
 ["Fucidine crème 2%","Acide fusidique","Antibiotique local","Crème",7.1,1,["1 application x 2/j"]],
 ["Ibuprofène 400 mg","Ibuprofène","AINS","Comprimé",3.6,1,["1 cp x 3/j après repas"]],
 ["Voltarène 50 mg","Diclofénac","AINS","Comprimé",4.8,1,["1 cp x 2/j après repas"]],
 ["Profenid 100 mg","Kétoprofène","AINS","Comprimé",6.0,1,["1 cp x 2/j après repas"]],
 ["Aspégic 100 mg","Acide acétylsalicylique","Antiagrégant / AINS","Sachet",3.1,1,["1 sachet/j au déjeuner"]],
 ["Spasfon","Phloroglucinol","Antispasmodique","Comprimé",3.4,1,["2 cp x 3/j"]],
 ["Débridat 100 mg","Trimébutine","Antispasmodique","Comprimé",5.6,1,["1 cp x 3/j avant repas"]],
 ["Smecta","Diosmectite","Antidiarrhéique","Sachet",4.2,1,["1 sachet x 3/j"]],
 ["Ercéfuryl 200 mg","Nifuroxazide","Anti-infectieux intestinal","Gélule",5.1,1,["1 gél x 4/j"]],
 ["Motilium 10 mg","Dompéridone","Antiémétique","Comprimé",3.8,1,["1 cp x 3/j avant repas"]],
 ["Vogalène 7,5 mg","Métopimazine","Antiémétique","Lyoc",4.0,1,["1 lyoc x 2/j"]],
 ["Mopral 20 mg","Oméprazole","IPP","Gélule",9.6,1,["1 gél/j le matin à jeun"]],
 ["Inexium 40 mg","Ésoméprazole","IPP","Comprimé",17.5,1,["1 cp/j le matin à jeun"]],
 ["Gaviscon","Alginate de sodium","Antiacide","Suspension",6.4,1,["1 sachet après chaque repas"]],
 ["Maxilase","Alpha-amylase","Anti-inflammatoire ORL","Sirop",4.9,1,["1 c. à soupe x 3/j"]],
 ["Rhinathiol adulte","Carbocistéine","Mucolytique","Sirop",4.4,1,["1 c. à soupe x 3/j"]],
 ["Toplexil","Oxomémazine","Antitussif","Sirop",4.6,1,["1 c. à soupe le soir"]],
 ["Aerius 5 mg","Desloratadine","Antihistaminique","Comprimé",10.2,1,["1 cp/j"]],
 ["Zyrtec 10 mg","Cétirizine","Antihistaminique","Comprimé",7.9,1,["1 cp le soir"]],
 ["Solupred 20 mg","Prednisolone","Corticoïde","Cp orodispersible",5.9,1,["2 cp/j le matin pendant 5 jours"]],
 ["Célestène 2 mg","Bétaméthasone","Corticoïde","Comprimé",6.7,1,["1 cp/j le matin"]],
 ["Ventoline 100 µg","Salbutamol","Bronchodilatateur","Inhalateur",9.4,1,["2 bouffées si crise"]],
 ["Seretide 250","Fluticasone + Salmétérol","Corticoïde inhalé","Diskus",58.0,1,["1 inhalation x 2/j"]],
 ["Glucophage 850 mg","Metformine","Antidiabétique","Comprimé",4.7,1,["1 cp x 2/j au milieu des repas"]],
 ["Diamicron 60 mg","Gliclazide","Antidiabétique - Sulfamide","Comprimé",11.2,1,["1 cp/j au petit-déjeuner"]],
 ["Amlor 5 mg","Amlodipine","Antihypertenseur","Gélule",9.9,1,["1 gél/j"]],
 ["Coversyl 5 mg","Périndopril","Antihypertenseur - IEC","Comprimé",13.4,1,["1 cp/j le matin"]],
 ["Aprovel 150 mg","Irbésartan","Antihypertenseur - ARA2","Comprimé",16.3,1,["1 cp/j"]],
 ["Lasilix 40 mg","Furosémide","Diurétique","Comprimé",2.9,1,["1 cp/j le matin"]],
 ["Tahor 20 mg","Atorvastatine","Hypolipémiant","Comprimé",19.8,1,["1 cp/j le soir"]],
 ["Levothyrox 50 µg","Lévothyroxine","Hormone thyroïdienne","Comprimé",4.3,1,["1 cp/j le matin à jeun"]],
 ["Tardyferon 80 mg","Sulfate ferreux","Antianémique","Comprimé",5.2,1,["1 cp/j"]],
 ["Vitamine D3 200 000 UI","Cholécalciférol","Vitamine","Ampoule buvable",3.5,1,["1 ampoule par mois"]],
 ["Magné B6","Magnésium + Vitamine B6","Minéral","Comprimé",6.1,0,["2 cp x 2/j"]],
 ["Daflon 500 mg","Diosmine","Veinotonique","Comprimé",12.7,0,["2 cp/j"]],
 ["Lexomil 6 mg","Bromazépam","Anxiolytique","Comprimé",4.6,1,["1/4 cp x 2/j"]],
 ["Myolastan 50 mg","Tétrazépam","Myorelaxant","Comprimé",5.0,1,["1 cp le soir"]],
 ["Biseptine","Chlorhexidine","Antiseptique","Solution",4.8,0,["2 applications/j"]],
 ["Sérum physiologique","Chlorure de sodium","Lavage nasal","Unidoses",3.0,0,["Lavage nasal x 3/j"]],
 ["Mycostatine","Nystatine","Antifongique","Suspension",6.6,1,["1 c. à café x 4/j"]],
 ["Pevaryl crème","Éconazole","Antifongique local","Crème",6.8,1,["1 application x 2/j"]],
 ["Optimizette","Désogestrel","Contraceptif","Comprimé",9.1,0,["1 cp/j en continu"]],
 ["Tobradex","Tobramycine + Dexaméthasone","Collyre antibiotique","Collyre",9.3,1,["1 goutte x 4/j"]],
];

const TEMPLATES_SEED = [
 ["Grippe adulte",[["Doliprane 1000 mg","1 cp x 3/j",1,"5 jours"],["Rhinathiol adulte","1 c. à soupe x 3/j",1,"7 jours"],["Aerius 5 mg","1 cp/j",1,"7 jours"],["Sérum physiologique","Lavage nasal x 3/j",1,"7 jours"]]],
 ["Angine bactérienne",[["Augmentin 1 g","1 cp x 2/j pendant 7 jours",2,"7 jours"],["Doliprane 1000 mg","1 cp x 3/j",1,"5 jours"],["Maxilase","1 c. à soupe x 3/j",1,"7 jours"]]],
 ["Gastro-entérite",[["Smecta","1 sachet x 3/j",1,"3 jours"],["Ercéfuryl 200 mg","1 gél x 4/j",1,"5 jours"],["Spasfon","2 cp x 3/j",1,"5 jours"],["Vogalène 7,5 mg","1 lyoc x 2/j",1,"3 jours"]]],
 ["Lombalgie aiguë",[["Voltarène 50 mg","1 cp x 2/j après repas",1,"7 jours"],["Myolastan 50 mg","1 cp le soir",1,"7 jours"],["Mopral 20 mg","1 gél/j le matin à jeun",1,"7 jours"]]],
 ["Infection urinaire",[["Ciproxine 500 mg","1 cp x 2/j",1,"5 jours"],["Spasfon","2 cp x 3/j",1,"5 jours"]]],
 ["HTA + Dyslipidémie (renouvellement)",[["Amlor 5 mg","1 gél/j",3,"3 mois"],["Tahor 20 mg","1 cp/j le soir",3,"3 mois"],["Aspégic 100 mg","1 sachet/j au déjeuner",3,"3 mois"]]],
];

const FIRST_M = ["Mohamed","Ahmed","Ali","Youssef","Karim","Hamza","Bilel","Sami","Walid","Anis","Mehdi","Skander","Oussama","Hichem","Nabil","Riadh","Slim","Fares","Aziz","Rami"];
const FIRST_F = ["Amira","Sana","Ines","Rania","Mariem","Nour","Salma","Hiba","Yasmine","Asma","Leila","Olfa","Sonia","Imen","Khadija","Fatma","Emna","Rim","Wafa","Nadia"];
const LAST = ["Ben Ali","Trabelsi","Gharbi","Jebali","Mejri","Hammami","Sassi","Chaabane","Ayari","Bouazizi","Mansouri","Riahi","Khelifi","Dridi","Ferchichi","Saidi","Belhaj","Zouari","Masmoudi","Jaziri","Cherif","Hamdi","Abidi","Mabrouk","Toumi","Nasri","Karoui","Ouni","Slimani","Baccouche"];
const CITIES = ["Tunis","Ariana","Ben Arous","La Marsa","Le Kram","Manouba","Bardo","El Menzah","Ennasr","Carthage"];
const MOTIFS = {"Grippe":"Fièvre, courbatures, toux sèche","Rhinopharyngite":"Nez qui coule, mal de gorge","Angine":"Odynophagie, fièvre 39°","Sinusite aiguë":"Céphalées frontales, rhinorrhée purulente","Bronchite aiguë":"Toux productive depuis 5 jours","Otite moyenne aiguë":"Otalgie droite","Gastro-entérite":"Diarrhée, vomissements","Infection urinaire":"Brûlures mictionnelles","HTA":"Contrôle tension artérielle","Diabète type 2":"Suivi diabète, renouvellement","Lombalgie":"Douleur lombaire après effort","Gastrite":"Épigastralgies, pyrosis","Réaction allergique":"Éruption cutanée prurigineuse","Dermatite":"Lésions cutanées","Asthme":"Dyspnée sifflante","Céphalée":"Céphalées récurrentes","Hypothyroïdie":"Suivi TSH","Anémie ferriprive":"Asthénie","Conjonctivite":"Œil rouge, larmoiement","Arthrose du genou":"Gonalgie mécanique","Dyslipidémie":"Résultats bilan lipidique","Anxiété":"Troubles du sommeil, stress","Cervicalgie":"Douleur cervicale","Pharyngite":"Mal de gorge","Colopathie fonctionnelle":"Ballonnements, douleurs abdominales"};
const DX_RX = {"Grippe":0,"Rhinopharyngite":0,"Angine":1,"Pharyngite":1,"Gastro-entérite":2,"Lombalgie":3,"Cervicalgie":3,"Infection urinaire":4,"HTA":5,"Dyslipidémie":5};

function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}

function buildDemo(){
 const R=rng(20261109),pick=a=>a[Math.floor(R()*a.length)],ri=(a,b)=>a+Math.floor(R()*(b-a+1));
 const today=new Date();today.setHours(0,0,0,0);
 const iso=d=>{const x=new Date(d);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};
 const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
 const meds=MEDS_SEED.map((m,i)=>({id:"m"+(i+1),nom:m[0],dci:m[1],classe:m[2],forme:m[3],pvp:m[4],remb:!!m[5],posologies:m[6],ci:"",garde:""}));
 const medBy=n=>meds.find(m=>m.nom===n);
 const templates=TEMPLATES_SEED.map((t,i)=>({id:"t"+(i+1),name:t[0],rx:t[1].map(l=>({medId:medBy(l[0]).id,nom:l[0],posologie:l[1],qte:l[2],duree:l[3]}))}));
 const patients=[];
 for(let i=0;i<64;i++){
  const sexe=R()<.52?"F":"M";
  const age=R()<.15?ri(1,15):ri(18,84);
  const dob=addD(today,-(age*365+ri(0,360)));
  const titre=sexe==="M"?(age<16?"Enf.":"Mr."):(age<16?"Enf.":(R()<.65?"Mme.":"Mlle."));
  const chronic=age>45&&R()<.45?pick(["HTA","Diabète type 2","Dyslipidémie","Hypothyroïdie","Asthme"]):"";
  const allergies=R()<.14?[pick(["Pénicilline","Aspirine","Sulfamides","AINS","Iode"])]:[];
  const regime=R()<.78?pick(["public","prive","remb"]):"none";
  patients.push({id:"p"+(i+1),dossier:String(ri(1000,62000)),titre,nom:pick(LAST),prenom:sexe==="M"?pick(FIRST_M):pick(FIRST_F),nomJF:"",sexe,dob:iso(dob),
   etat:age<25?"cel":pick(["mar","mar","mar","cel","div","veuf"]),enfants:age<25?0:ri(0,4),cin:age>=18?String(ri(10000000,14999999)).padStart(8,"0"):"",
   adresse:ri(1,120)+" Rue "+pick(["de Marseille","Ibn Khaldoun","de la Liberté","Habib Bourguiba","de Palestine","Hédi Chaker","Alain Savary"]),ville:pick(CITIES),
   tel:pick(["2","5","9","4"])+String(ri(1000000,9999999)),tel2:"",profession:age<18?"Élève":pick(["Enseignant(e)","Ingénieur","Commerçant","Fonctionnaire","Retraité(e)","Infirmier(e)","Étudiant(e)","Sans profession","Technicien","Comptable"]),adrPar:"",
   groupe:pick(["A+","O+","B+","AB+","O-","A-",""]),allergies,
   cnam:{caisse:regime==="none"?"":pick(["CNAM","CNAM","CNRPS"]),regime,qualite:age<18?"enfant":pick(["assure","assure","conjoint"]),idu:regime==="none"?"":String(ri(100000000,999999999)),rang:age<18?ri(1,3):0,apci:chronic?chronic:""},
   ant:{med:chronic?chronic+(R()<.5?" depuis "+ri(2005,2022):""):"",chir:R()<.25?pick(["Appendicectomie "+ri(1995,2020),"Cholécystectomie "+ri(2005,2022),"Césarienne "+ri(2008,2021),"Amygdalectomie (enfance)"]):"",gyn:sexe==="F"&&age>20?"G"+ri(0,4)+"P"+ri(0,3):"",fam:R()<.35?pick(["Père diabétique","Mère HTA","Cancer du sein (mère)","Cardiopathie (père)"]):"",hab:sexe==="M"&&R()<.35?"Tabac "+ri(5,30)+" PA":"",trait:""},
   remarques:"",createdAt:iso(addD(today,-ri(30,2600)))});
 }
 // visits
 const visits=[],doctors=["Dr Dhaker"];
 const tarifs={C1:55,C2:70,V:80,ECG:30};
 let vid=1;
 const chronicDx=p=>p.cnam.apci;const base={};
 for(let d=-150;d<=0;d++){
  const day=addD(today,d);const dow=day.getDay();if(dow===0)continue;
  const n=dow===6?ri(3,7):ri(6,13);if(d===0)continue;
  for(let k=0;k<n;k++){
   const p=pick(patients);
   const dx=chronicDx(p)&&R()<.5?chronicDx(p):pick(DIAG_COMMON);
   visits.push(mkVisit(p,iso(day),String(ri(8,17)).padStart(2,"0")+":"+pick(["00","15","30","45"]),dx));
  }
 }
 function mkVisit(p,date,time,dx){
  const code=R()<.9?"C1":"C2",hon=tarifs[code];
  const bs=p.cnam.regime==="none"?"sans":(R()<.55?"avec":"sans");
  const paid=R()<.94?hon:(R()<.5?0:Math.round(hon/2));
  const age=(new Date(today)-new Date(p.dob))/315576e5;
  const B=base[p.id]||(base[p.id]=age<15?{w:Math.round(8+age*3.2),h:Math.round(75+age*6)}:{w:ri(55,98),h:ri(155,188),s:p.cnam.apci==="HTA"?ri(140,158):ri(112,132),d:ri(68,86)});
  const vitals=age<15?{poids:B.w+ri(0,2),taille:B.h,temp:(36.6+R()*2.2).toFixed(1)}:{poids:B.w+ri(-2,2),taille:B.h,ta_s:B.s+ri(-8,8),ta_d:B.d+ri(-5,5),fc:ri(64,92),temp:(36.4+R()*1.4).toFixed(1),gly:chronicDx(p)==="Diabète type 2"?(1.15+R()*0.8).toFixed(2):"",spo2:ri(96,99)};
  let rx=[];
  if(DX_RX[dx]!==undefined){rx=templates[DX_RX[dx]].rx.map(l=>({...l}));}
  else{const nb=ri(1,3);for(let j=0;j<nb;j++){const m=pick(meds);rx.push({medId:m.id,nom:m.nom,posologie:m.posologies[0],qte:1,duree:ri(5,10)+" jours"});}}
  return {id:"v"+(vid++),patientId:p.id,date,time,doctor:"Dr Dhaker",motif:MOTIFS[dx]||"",diagnostic:dx,observations:R()<.5?"Examen clinique sans particularité en dehors de la symptomatologie.":"",vitals,rx,analyses:R()<.15?["NFS","CRP","Glycémie à jeun"]:[],imagerie:R()<.06?[pick(IMAGERIE)]:[],code,honoraires:hon,recu:paid,bs};
 }
 // today visits already done (morning)
 const todayP=[];
 for(let k=0;k<6;k++){const p=patients[(k*7+3)%patients.length];todayP.push(p);const v=mkVisit(p,iso(today),String(8+k).padStart(2,"0")+":"+pick(["00","20","40"]),chronicDx(p)||pick(DIAG_COMMON));if(p.cnam.regime!=="none")v.bs=k%2?"avec":"sans";if(k===4)v.recu=0;if(k===2)v.recu=30;visits.push(v);}
 // appointments this week + today queue
 const rdv=[];let rid=1;
 const monday=addD(today,-((today.getDay()+6)%7));
 for(let d=0;d<6;d++){
  const day=addD(monday,d);const isToday=iso(day)===iso(today);
  const hours=["08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
  const n=ri(5,9);const used=new Set();
  for(let k=0;k<n;k++){let h=pick(hours);if(used.has(h))continue;used.add(h);const p=pick(patients);
   let status="prevu";if(day<today)status=R()<.88?"termine":"absent";if(isToday&&h<String(new Date().getHours()).padStart(2,"0")+":00")status=R()<.9?"termine":"absent";
   rdv.push({id:"r"+(rid++),patientId:p.id,name:"",phone:"",date:iso(day),time:h,duration:30,motif:R()<.4?"Contrôle":(R()<.5?"Renouvellement ordonnance":""),status});}
  if(isToday){
   const nowH=new Date().getHours();
   const q=[["14:00","arrive"],["14:30","arrive"],["15:00","prevu"],["15:30","prevu"],["16:30","prevu"]];
   q.forEach((x,j)=>{const p=patients[(j*11+5)%patients.length];rdv.push({id:"r"+(rid++),patientId:p.id,name:"",phone:"",date:iso(day),time:x[0],duration:30,motif:j===0?"Résultats d'analyses":"",status:x[1]})});
   rdv.push({id:"r"+(rid++),patientId:null,name:"Mme. Haddad Sirine",phone:"98 456 120",date:iso(day),time:"17:30",duration:30,motif:"Première consultation",status:"prevu"});
   // remove duplicates at same time for today
   const seen={};for(let j=rdv.length-1;j>=0;j--){const r=rdv[j];if(r.date!==iso(day))continue;if(seen[r.time]){rdv.splice(j,1);}else seen[r.time]=1;}
  }
 }
 const payments=[];
 return {version:1,settings:{doctor:{name:"Dr Dhaker",spe:"Médecine générale",addr:"12 Avenue Habib Bourguiba",city:"Tunis",phone:"71 000 000",email:"",cnam:"",mf:"",hours:"Lun–Ven 8h–18h · Sam 8h–13h"},doctors,
  tarifs:[{code:"C1",label:"Consultation",price:55},{code:"C2",label:"Consultation longue / spécialisée",price:70},{code:"V",label:"Visite à domicile",price:80},{code:"ECG",label:"Électrocardiogramme",price:30},{code:"G",label:"Gratuit / contrôle",price:0}],
  agenda:{start:"08:00",end:"18:00",slot:30},pin:""},
  patients,visits,meds,templates,rdv,payments};
}
