const puppeteer = require('puppeteer');
const fs = require('fs').promises;

(async () => {
    // Read websites.txt
    const websitesResponse = await fs.readFile('websites.txt', 'utf-8');
    let websitesData = websitesResponse.split('\n');

    // Map out the websites and extend the array element
    // to an object with keys for the data you want to save
    // from each website
    let websites = websitesData.map(element => {
        return {
            website: element.replaceAll(/\s/gi, ''),
            statusCode: null,
            aTagsOrGtBtnLink: null,
            error: 'no error'
        }
    });

    const browser = await puppeteer.launch();
    let page = null;

    // start looping through the websites
    for (let i = 0; i < websites.length; i++) {
        let url = websites[i].website;
        page = await browser.newPage();
        
        try {
            // Go to the website.
            // In this case it tries to trigger
            // a 404-response from the server,
            // hense the weird path

            //BUG it should try both http and https somehow
            const response = await page.goto('https://' + url + '/askjhkjkjnasiudhfiusahdfb/', {timeout: 10000});

            websites[i].statusCode = response.status();
        
            // If 404, look at the 404-page
            if (response.status() === 404) {
                let links = [];

                // $$eval let's you work with the 
                // page as if you were getting 
                // elements into vanilla JS.
                // Like querySelectorAll, then
                // a callback on what you wish to
                // do with the elements.
                links = await page.$$eval('a', aTags => (
                    aTags.map(aTag => {
                        let rObj = {};
                        rObj[aTag.textContent] = aTag.href;
                        return rObj;
                    })
                ));
                if (links.length > 0) {
                    websites[i].aTagsOrGtBtnLink = links;
                } else {
                    websites[i].aTagsOrGtBtnLink = 'no button/links found';
                }
            }
        } catch (err) {
            websites[i].error = err;
        }
    
        await page.close();

        console.log('progress: ' + Math.round((i / (websites.length - 1)) * 100 )) + ' percent';
    }
    // end loop

    await browser.close(); 

    await fs.writeFile('result.json', JSON.stringify(websites));
})();