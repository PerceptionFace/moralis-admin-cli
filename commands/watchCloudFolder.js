const chokidar = require('chokidar');
const Sentry = require("@sentry/node");
const fs = require('fs');
const axios = require('axios');
const help = require('../help')
const utils = require('../utils')
const { BASE_URI } = require('../config');
require('dotenv').config()
const grab = require('ps-grab');
const path = require('path');
const glob = require("glob");
const keypress = require('keypress');
const check = require('syntax-error');
const ncc = require('@vercel/ncc');
const ora = require('ora');

keypress(process.stdin);

/**
 * Syncs the changes of a local folder (including sub ones & js files only) to the cloud functions of a server
 */
function watchCloudFolder(){

    // Display help section if asked for it
    if (process.argv[3] == "help") return help.showHelp("watch-cloud-folder");    

    // Get credentials
    const apiKey = utils.getApiKey();
    const apiSecret = utils.getApiSecret();

    // Get path to the cloud folder
    const folderPath = grab('--moralisCloudfolder') || grab('-p') || process.env.moralisCloudFolder || utils.getFilePath("Specify path to cloud functions folder: ");

    // Get server to use
    let subdomain = grab('--moralisSubdomain') || grab('-d') || process.env.moralisSubdomain;

    // Select auto or manual save
    let autoSave = grab('--autoSave') || grab('-s') || process.env.moralisAutoSave;
    if(!autoSave) {
        const mode = [{id: 0,name: 'manual save'},{id: 1,name: 'auto save'}];
        const possibileAnswers = mode.reduce((a,o,i) => (a.push(`\n(${i})${o.name}`),a),[]).join('');
        console.log(`Select mode: ${possibileAnswers}`)
        autoSave = utils.requireInput('', possibileAnswers);
    }

    // List all files
    const getDirectories = function (src, callback) {
        glob(src + '/**/*', callback);
    };

    (async() => {
        // If no server was provided or it was provided in a invalid promat
        if(subdomain == undefined || subdomain.length !== 23){

            // get all user severs and let the user chose which one to use
            const servers = await utils.getUserServers(apiKey, apiSecret);
            const server = utils.getSelectedServer(servers);
            subdomain = server.subdomain;
        }

        try {

            // This variable will contain the data to upload
            let dataToUpload = "";

            if(autoSave == 1) {
                const throbber = ora({
                    text: `Listening folder: ${folderPath}`,
                    spinner: {
                        frames: ['-', '|'],
                        interval: 300, // Optional
                    },
                    }).start();

                // Watch to folder and sub folders changes
                chokidar.watch(folderPath).on('all', (event, p) => {

                    const outputPath = path.join(__dirname, '../');

                    if((event === "add" || event === "change" || event === "unlink") && !p.includes('node_modules')) {

                        // Safe operation, to avoid an error if output.js exists because the code throw in a older attempt to save
                        if (fs.existsSync(`${outputPath}output.js`)) {
                            fs.unlinkSync(`${outputPath}output.js`);
                        }

                        // Check if what added / changed has a `.js` extension (we ignore folders and other non-js files)
                        if(path.extname(p) === ".js") {

                            getDirectories(folderPath, async function (err, res) {
                                if (err) console.log(err); 

                                dataToUpload = "";

                                // Iterate the array of files, and save content 
                                for(let i = 0; i < res.length; i++) {
                                    if(path.extname(res[i]) === ".js") {

                                        // Read file
                                        const data = fs.readFileSync(res[i], 'utf8');

                                        // Check for syntax error
                                        if(checkForSyntaxError(data, res[i])) {
                                            return;
                                        }

                                        // Save content
                                        dataToUpload += `${data}\n`;
                                    }
                                }
                                
                                fs.writeFileSync(`${outputPath}output.js`, dataToUpload);

                                throbber.stop();

                                ncc(`${outputPath}output.js`, {
                                    cache: "./custom/cache/path" | false,
                                    externals: ["externalpackage"],
                                    filterAssetBase: process.cwd(), // default
                                    sourceMapBasePrefix: '../', // default treats sources as output-relative
                                    sourceMapRegister: true, // default
                                }).then(async ({ code }) => {
                                    await post({
                                        apiKey,
                                        apiSecret,
                                        parameters : {
                                            subdomain,
                                            cloud: code,
                                            isCli: true
                                        }
                                    });
                                    if (fs.existsSync(`${outputPath}output.js`)) {
                                        fs.unlinkSync(`${outputPath}output.js`);
                                    } 
                                    
                                    
                                }).catch(function (error) {
                                    console.log('Error saving file, please try again');
                                });
                            });
                        }
                    }
                });
            } else if(autoSave == 2){
                const outputPath = path.join(__dirname, '../');

                        // Safe operation, to avoid an error if output.js exists because the code throw in a older attempt to save
                        if (fs.existsSync(`${outputPath}output.js`)) {
                            fs.unlinkSync(`${outputPath}output.js`);
                        }

                        dataToUpload = "";
                        getDirectories(folderPath, async function (err, res) {
                            if (err) throw (err); 
                        
                            // Iterate the array of files, and save content 
                            for(let i = 0; i < res.length; i++) {
                                if(path.extname(res[i]) === ".js" && !res[i].includes('node_modules')) {
                    
                                    // Read file
                                    const data = fs.readFileSync(res[i], 'utf8');
                                    
                                    // Check for syntax error
                                    if(checkForSyntaxError(data, res[i])) {
                                        return;
                                    }
                                    
                                    // Save content
                                    dataToUpload += `${data}\n`;
                                }
                            }
                            
                            fs.writeFileSync(`${outputPath}output.js`, dataToUpload);

                            ncc(`${outputPath}output.js`, {
                                cache: "./custom/cache/path" | false,
                                externals: ["externalpackage"],
                                filterAssetBase: process.cwd(), // default
                                sourceMapBasePrefix: '../', // default treats sources as output-relative
                                sourceMapRegister: true, // default
                            }).then(async ({ code }) => {
                                await post({
                                    apiKey,
                                    apiSecret,
                                    parameters : {
                                        subdomain,
                                        cloud: code,
                                        isCli: true
                                    }
                                });

                                if (fs.existsSync(`${outputPath}output.js`)) {
                                    fs.unlinkSync(`${outputPath}output.js`);
                                }
                            
                            }).catch(function (error) {
                                console.log('Error saving file, please try again');
                            })
                    
                        });
            } 
             else {

                console.log("Press the key `s` and `enter` to save and upload to cloud");
                
                // Manual save trigger
                process.stdin.on("keypress", async function (ch, key) {
                    if(key.name === "s") {

                        const outputPath = path.join(__dirname, '../');

                        // Safe operation, to avoid an error if output.js exists because the code throw in a older attempt to save
                        if (fs.existsSync(`${outputPath}output.js`)) {
                            fs.unlinkSync(`${outputPath}output.js`);
                        }

                        dataToUpload = "";
                        getDirectories(folderPath, async function (err, res) {
                            if (err) throw (err); 
                        
                            // Iterate the array of files, and save content 
                            for(let i = 0; i < res.length; i++) {
                                if(path.extname(res[i]) === ".js" && !res[i].includes('node_modules')) {
                    
                                    // Read file
                                    const data = fs.readFileSync(res[i], 'utf8');
                                    
                                    // Check for syntax error
                                    if(checkForSyntaxError(data, res[i])) {
                                        return;
                                    }
                                    
                                    // Save content
                                    dataToUpload += `${data}\n`;
                                }
                            }
                            
                            fs.writeFileSync(`${outputPath}output.js`, dataToUpload);

                            ncc(`${outputPath}output.js`, {
                                cache: "./custom/cache/path" | false,
                                externals: ["externalpackage"],
                                filterAssetBase: process.cwd(), // default
                                sourceMapBasePrefix: '../', // default treats sources as output-relative
                                sourceMapRegister: true, // default
                            }).then(async ({ code }) => {
                                await post({
                                    apiKey,
                                    apiSecret,
                                    parameters : {
                                        subdomain,
                                        cloud: code,
                                        isCli: true
                                    }
                                });

                                if (fs.existsSync(`${outputPath}output.js`)) {
                                    fs.unlinkSync(`${outputPath}output.js`);
                                }
                            
                            }).catch(function (error) {
                                console.log('Error saving file, please try again');
                            })
                    
                        });
                    }
                });
            }
        } catch (e) {
            Sentry.captureException(e);
        }
        
    })()
}




/**
 * Save to cloud function
 */
async function post (data) {
    try{
        await axios.post(`${BASE_URI}/api/cli/savecloud`, data);
        console.log("Changes Uploaded Correctly");
    } catch (error) {
        console.log("Upload error", error);
    }
}

function checkForSyntaxError (data, file) {
    const syntaxError = check(data, file);
    if(syntaxError) { 
        console.log(syntaxError);
        return true;                    
    }
    return false;
}


module.exports = {
    watchCloudFolder
}