import fetch from 'node-fetch';
import * as fs from 'fs';
// Define "require"
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// json to csv modules
const csvToJsonData = require("csvtojson");
const jsonToCsvData = require("json2csv").parse;
 
const cheerio = require('cheerio');
 
const storeNames = ["howard",
// "husky",
// "hwc",
// "hws"
];
// let storeName = "gatech";
//get storeId from link of arrays.
let j = 0;
async function getData(){
    // let fullData = [];
    for(let i=0; i<storeNames.length; i++){
        await getStore(storeNames[i]);
        // break;
        // fullData.push(res);
    }
    // console.log(fullData);
    // let saveData = JSON.stringify(fullData);
    // fs.writeFile('./bncollege_jsons/totalLinks.json',saveData, function (err) {
    //     if (err) throw err;
    //     console.log('Data Saved');
    // });
}
getData();
// getBooks('s','l');
async function getStore(storeName) {
    const str =  await fetch(`https://${storeName}.bncollege.com/sitemap.html`, {
        method: 'GET',
        mode: 'cors',
        headers: getHeaderString(),
    })
    let res = await str.text();
    // console.log(res);
    let totalData = [];
    const $ = cheerio.load(res);
    let textbookLen = $(".product-title-container").length;
    let isTextBook = 0;
    let n = 0;
    //condition if textbook
    let rawdata = fs.readFileSync('stackData.json');
    let allBooksData = await JSON.parse(rawdata);
    for(let l=0; l<textbookLen; l++){
        let bookDnum = 0;
        if($(".product-title-container").eq(l).text() == 'Textbooks'){
            // console.log(storeName," you have textbooks");
            isTextBook = 1;
            let booksLen = $(".sitemap-product-ul").eq(l).find("a").length;
            for(let b=0; b<booksLen; b++){
                if(n>268){
                    let bookName = $(".sitemap-product-ul").eq(l).find("a").eq(b).text().trim();
                    let bookLink = $(".sitemap-product-ul").eq(l).find("a").eq(b).attr("href");
                    totalData.push({storeName,bookName,bookLink});
                    let bookData = await getBooks(storeName,bookLink);
                    for(let c=0; c<bookData.length; c++){
                        allBooksData.push(bookData[c]);
                    }
                    let stackData = JSON.stringify(allBooksData);
                    fs.writeFile('./stackData.json',stackData, function (err) {
                        if (err) throw err;
                        console.log("book number:",n," is saved to stack memory");
                    });
                }
                n++;
                bookDnum = Math.floor(Math.random()*1000000);
            }
            // rawdata = fs.readFileSync('stackData.json');
            // allBooksData = JSON.parse(rawdata);
            let allbooksDetail = JSON.stringify(allBooksData);
            // console.log(totalData);
            let saveData = JSON.stringify(totalData);
            j++;
            fs.writeFile('./bncollege_jsons/oneByOneLinks/'+storeName+'_'+bookDnum+'.json',saveData, function (err) {
                if (err) throw err;
                console.log('Data Saved');
            });
            saveData = '';
            fs.writeFile('./bncollege_jsons/booksDetails/'+storeName+'_'+bookDnum+'.json',allbooksDetail, function (err) {
                if (err) throw err;
                console.log('Data Saved');
            });
            // allbooksDetail = '';
            //create csv for get books
            let source = await csvToJsonData().fromFile("./bncollege.csv");
            for(let d=0; d<allBooksData.length; d++){
                source.push(allBooksData[d]);
            }
            const csv = jsonToCsvData(source,{fields:["storeId","storeName","school","campusName","campusId","termName","termId","depName","depId","courseName","courseId","sectionName","sectionId","bookName","bookLink","newBookId","bookImg","author","edition","publisher","isbn"]});
            fs.writeFileSync("./bncollege.csv",csv);
            console.log("saved json data in csv");
            source = [];
            allBooksData = [];
            rawdata = '';
            let stackData = JSON.stringify(allBooksData);
            fs.writeFile('./stackData.json',stackData, function (err) {
                if (err) throw err;
                console.log("stack memory cleared");
            });
            // bookDnum ++;
        }else if(isTextBook = 0){
            console.log("you don't any textbook");
            totalData.push({storeName});
            let saveData = JSON.stringify(totalData);
            j++;
            fs.writeFile('./bncollege_jsons/oneByOneLinks/'+storeName+'_'+bookDnum+'.json',saveData, function (err) {
                if (err) throw err;
                console.log('Data Saved');
            });
            saveData = '';
            console.log(storeName," data saved");
            let source = await csvToJsonData().fromFile("./bncollege.csv");
            source.push({storeId:"No Data",storeName});
            const csv = jsonToCsvData(source,{fields:["storeId","storeName","school","campusName","campusId","termName","termId","depName","depId","courseName","courseId","sectionName","sectionId","bookName","bookLink","newBookId","bookImg","author","edition","publisher","isbn"]});
            fs.writeFileSync("./bncollege.csv",csv);
            console.log("saved json data in csv");
            source = [];
            // bookDnum ++;
        }
    }
    // return totalData;
}
 
 
async function getBooks(storeName,bookLink){
    const str =  await fetch(`${bookLink}`, {
        method: 'GET',
        mode: 'cors',
        headers: getHeaderString(),
    })
    let res = await str.text();
    const $ = cheerio.load(res);
    let school = $(".preheaderWelcomeMsg").eq(0).text().trim()||'';
    console.log(school);
    let bookName = $('.bookTitle1').find(".TextBookH1").text().trim()||'';
    let author = $('.bookTitle1').find("h3").text().replace("By","")||'';
    let bookImg = $('.bookinDetails_thumb1>img').attr('src')||'';
    console.log("Book:",bookName," Author:",author," BookImage",bookImg);
    $('.bookinDetails_desc').find('span').remove();
    let edition = $('.bookinDetails_desc').find('li').eq(0).text().trim()||'';
    let publisher = $('.bookinDetails_desc').find('li').eq(1).text().trim()||'';
    let isbn = $('.bookinDetails_desc').find('li').eq(2).text().trim()||'';
    console.log("edition: ",edition.trim(),"publisher: ",publisher.trim()," isbn:",isbn.trim());
    let newBookId = $("#newBookId").attr("value")||'';
    let storeId = $("[name=displayStoreId]").attr("value")||'';
    let data = [];
    let termLen = $("#TB_TERM_ID").find("li").length;
    let termName = '';
    let termId = '';
    let campusName = '';
    let campusId = '';
    let depId = '';
    let depName = '';
    let courseId = '';
    let courseName = '';
    let sectionName = '';
    let sectionId = '';
    if(termLen>0){
        for(let a=0; a<termLen; a++){
            termName = $("#TB_TERM_ID").find("li").eq(a).text()||'';
            termId = $("#TB_TERM_ID").find("li").eq(a).attr("data-optionvalue")||'';
            campusName = $("#TB_CAMPUS_LABEL_ID").text()||'';
            campusId = $("#selectedCampusId").attr("value")||'';
            console.log("bookId: ",newBookId," termName: ",termName," termId: ",termId,"storeId: ",storeId," campus name: ",campusName," campusId: ",campusId);
            if(termId){
                let department = await getDepartment(storeId,termId,newBookId)||'';
                let depLen = department.length;
                if(depLen>0){
                    for(let i=0; i<depLen; i++){
                        depId = department[i].catgroupId;
                        depName = department[i].courseSection;
                        console.log("departmentId "+(i+1)+": ",depId," department name: ",depName);
                        let courses = await getCourses(storeId,depId,newBookId)||'';
                        let courseLen = courses.length;
                        if(courseLen>0){
                            for(let j=0; j<courseLen; j++){
                                courseName = courses[j].courseSection;
                                courseId = courses[j].catgroupId;
                                console.log("course name: ",courseName," courseId: ",courseId);
                                let sections = await getSections(storeId,courseId,newBookId);
                                let sectionLen = sections.length;
                                if(sectionLen>0){
                                    for(let k=0; k<sectionLen; k++){
                                        sectionName = sections[k].courseSection;
                                        sectionId = sections[k].catgroupId;
                                        console.log("section name: ",sectionName," section id: ",sectionId);
                                        let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
                                        data.push(sData);
                                    }
                                }else{
                                    let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
                                    data.push(sData);
                                }
                            }
                        }else{
                            let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
                            data.push(sData);
                        }
                    }
                }else{
                    let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
                    data.push(sData);
                }
            }
        }
    }else{
        let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
        data.push(sData);
    }
    console.log(data);
    return data;
}
 
async function getDepartment(storeId,termId,newBookId){
    const str =  await fetch(`https://gatech.bncollege.com/shop/gatech/textbook/TermDepCourseJsonControllerCmd?termId=${termId}&type=DEP&displayStoreId=${storeId}&newBookId=${newBookId}`, {
        method: 'GET',
        mode: 'cors',
        headers: getHeaderString2(),
    })
    const ret = await str.json();     
    return ret;
}
 
async function getCourses(storeId,depId,newBookId){
    const str =  await fetch(`https://gatech.bncollege.com/shop/gatech/textbook/TermDepCourseJsonControllerCmd?depId=${depId}&type=COURSE&displayStoreId=${storeId}&newBookId=${newBookId}`, {
        method: 'GET',
        mode: 'cors',
        headers: getHeaderString2(),
    })
    const ret = await str.json();     
    return ret;
}
 
async function getSections(storeId,courseId,newBookId){
    const str =  await fetch(`https://gatech.bncollege.com/shop/gatech/textbook/TermDepCourseJsonControllerCmd?courseId=${courseId}&type=SECTION&displayStoreId=${storeId}&newBookId=${newBookId}`, {
        method: 'GET',
        mode: 'cors',
        headers: getHeaderString2(),
    })
    const ret = await str.json();     
    return ret;
}
 
function wait(ms){
    return;
    ms = ms || false;
    if (!ms) {
        // ms = generateTimeStamp(20000, 30000);
    
        ms = generateTimeStamp(2000, 4000);
    }
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
        end = new Date().getTime();
    }
}
 
function generateTimeStamp(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
 
function getHeaderString() {
    return  {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
    }
}
 
function getHeaderString2() {
    return  {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
    }
}

