const https = require('https');
const JSSoup = require('jssoup').default;
const fs = require('fs');
const url = "https://en.wikipedia.org/wiki/Lantern_Festival"; // FIRST: find a url of a page you are interested in from wikipedia 
const jsonPath = "./json/"; 
const name = "Lantern Festival";


/*
This web-scraping example is set up for working with wikipedia.If you want to adapt this
to scrape another site you should go and inspect the site in the browser first, then adapt this. 
*/

function getParagraphs(soupTag){
    let paragraphs = soupTag.findAll('p');
    let paragraphsText = [];
    for(let i = 0; i < paragraphs.length; i++){
        let text = paragraphs[i].getText();
        paragraphsText.push(text);
    }

    return paragraphsText;
}

//returns one large string of all text
function getParagraphText(soupTag){
    let paragraphs = soupTag.findAll('p');
    
    let text = '';
    let sentence = [];

    for(let i = 0; i < paragraphs.length; i++){
        text += paragraphs[i].getText();
        sentence = text.split('. ')
    }

    return sentence;
}

function getAllExternalLinks(soupTag){
    let aTags = soupTag.findAll('a'); // return an array of SoupTag object
    let links = [];
   
    for(let i = 0; i < aTags.length; i++){
        let attrs = aTags[i].attrs;// get a tag attributes
        // if there is an href attribute let's get it
        if('href' in attrs){
            let hrefValue = attrs.href;
            if(hrefValue.indexOf('index.php') == -1 && hrefValue[0] != '#' ){
                //add the start 'https://en.wikipedia.org' to any internal wikipedia urls 
                if(hrefValue.indexOf('/wiki/') != -1 && hrefValue.indexOf('.org') == -1){
                    hrefValue = 'https://en.wikipedia.org'+hrefValue;
                }

                let text = aTags[i].getText();
                let link = {
                    "href": hrefValue,
                    "text": text
                };

                links.push(link);
            }else{
                // console.log(hrefValue);
            }
        }
 
    }

    return links;
}

//pass in Plain Old Javascript Object that's formatted as JSON
function writeJSON(data){
    try {
        let path = jsonPath+name+".json";
        fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
        console.log("JSON file successfully saved");
    } catch (error) {
        console.log("An error has occurred ", error);
    }
}

//create soup  
function createSoup(document){
    
    let soup = new JSSoup(document);
    let data = {
        "name": name,
        "url": url,
        "content": {}
    }; 

    let main = soup.find('main');//only get the content from the main body of the page
    
    let bodyContent = soup.find('div', { id: 'bodyContent' });

    data.content = {
        "externalLinks": getAllExternalLinks(bodyContent),

        "text": getParagraphText(main)
    };
        
    //output json
    writeJSON(data);

}

//Request the url
https.get(url, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    
    let document = [];

    res.on('data', (chunk) => {
        document.push(chunk);
    }).on('end', () => {
        document = Buffer.concat(document).toString();
        // console.log(body);
        createSoup(document);
    });

}).on('error', (e) => {
    console.error(e);
});

