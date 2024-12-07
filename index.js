const functions = require('@google-cloud/functions-framework');
// Import the required modules
const { Storage } = require('@google-cloud/storage');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Initialize the Google Cloud Storage client
const storage = new Storage();

functions.http('helloHttp', (req, res) => {
  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);
});

functions.http('screenshot', async (req, res) => {    
  try {
    // Placeholder for Google Cloud Storage bucket name (to be filled)
    const bucketName = 'b-2443'; // GCS bucket name

    // Extract the URL from the request or default to 'https://www.google.com'
    const url = req.query.url || 'https://www.google.com';

    // Parse the URL to extract the hostname
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Construct the GCS filename using the hostname
    const gcsKey = `screenshots/${hostname}.png`;

    console.log(url, parsedUrl, hostname)
    // Launch a headless Chrome browser using Puppeteer with no-sandbox argument
    const browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: [...chromium.args, '--no-sandbox'],
      headless: true
    });

    // Open a new page in the browser
    const page = await browser.newPage();

    // Navigate to the specified URL
    await page.goto(url);

    // Take a screenshot of the page
    const screenshotBuffer = await page.screenshot();

    // Close the browser
    await browser.close();

    // Upload the screenshot to Google Cloud Storage
    await storage.bucket(bucketName).file(gcsKey).save(screenshotBuffer, {
      contentType: 'image/png',
    });

    console.log(`Screenshot uploaded to ${bucketName}/${gcsKey}`);
    res.status(200).send(`Screenshot uploaded to ${bucketName}/${gcsKey}`);
  } catch (error) {
    // Handle and log errors
    console.error('Error:', error);
    res.status(500).send('Error: ' + error.toString());
  }
});
