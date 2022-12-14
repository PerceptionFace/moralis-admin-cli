const archiver = require('archiver');
const grab = require('ps-grab');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config()
const { BASE_URI } = require('moralis-admin-cli/config');
const prompt = require('prompt-sync')({sigint: true});

///////////////////////////
// Console input helpers //
///////////////////////////

/**
 * Retrieves the Moralis API Key from either the argument list, .env file, environment variables or keyboard input
 */
getApiKey = () => grab('--moralisApiKey') || grab('-k') || process.env.moralisApiKey || requireInput("Specify Moralis Api Key: ");

/**
 * Retrieves the Moralis API Secret from either the argument list, .env file, environment variables or keyboard input
 */
getApiSecret = () => apiSecret = process.env.moralisApiSecret || grab('--moralisApiSecret') || grab('--s') || requireInput("Specify Moralis Api Secret: ");


/**
 * Keeps asking the user for input based on a given question until it matches any of the provided valid answers.
 * if the valid answers is not provided, any answer other than empty string is accepted
 * @param {String} question
 * @param {String[]} validAnswers
 * @returns {String}
 */
function requireInput(question, validAnswers) {

    // Loop until a valid answer is given
    while(true){

        // Show the prompt to the user and store the response
        const answer = prompt(question); 

        // If no answer was given or if the answer is not included in the list of valid responses
        if (answer.length == 0 || (validAnswers != undefined && !validAnswers.includes(answer))) {

            // Give the user another try
            console.log("Invalid input!");
            continue;
        }

        // Return the answer
        return answer;
   }
}

/**
 * Gets a selected server owned by the user that the user wants to use.
 * ownedServers: list of servers owned by the user
 * @param {Object[]} ownedServers
 * @returns {Object}
 */
function getSelectedServer(ownedServers) {
    // Make a list of all the servers along with a number, example (1) My first server
    const availableServers = ownedServers.reduce((a,o,i) => (a.push(`\n(${i}) ${o.name}`),a), []).join('');

    // Check if the user supplied a server in the argument list
    const chosenServer = grab("--moralisSubdomain") || grab("-d") || process.env.moralisSubdomain;

    // If so
    if (chosenServer){

        // Filter out all servers that does not match the choice
        const servers = ownedServers.filter(item => item.subdomain == chosenServer);

        // If we have a match then return it
        if (servers.length > 0){
            return servers[0];                      
        }     

        // If we get here, the user provided a subdomain not owned by the user or it was provided in a wrong format
        console.log("Subdomain not found!");   
    }

    // Define an array of acceptable choices for the user
    const possibleAnswers = ownedServers.reduce((a,o,i) => (a.push(`${i}`),a), []);

    // Show the available choices
    console.log(`Following servers were found:${availableServers}`);

    // Ask the user to choose a server until we get a valid response
    const serverNumber = requireInput(`What server do you want to connect to?: `, possibleAnswers);

    // Return the chosen server
    return ownedServers[parseInt(serverNumber)];    
}

/**
 * Gets a selected local devchain that the user wants to use.
 * @returns {Object}
 */
function getGetLocalDevchain() {

    // Define supported chains
    let supportedDevChains = [
        {
            name: "Ganache",
            port: 7545
        },
        {
            name: "Hardhat",
            port: 8545
        }
    ];

    // Check if the user supplied a chain in the argument list
    const chosenChain = grab('--chain') || grab('-c') || process.env.chain;

    // if so
    if (chosenChain){

        // Filter out all chains that does not match the choice
        const supportedChosenDevChains = supportedDevChains.filter(item => item.name.toLowerCase() == chosenChain.toLowerCase());

        // If we have a match then return it
        if (supportedChosenDevChains.length > 0){
            return supportedChosenDevChains[0];
                 
        }

        // If we get here, the user provided a chain is not supported ot was provided in a wrong format
        console.log("Devchain not found!");
       
    }  

    // Define a list of the supported chains
    const supportedDevchainNames = supportedDevChains.reduce((a,o,i) => (a.push(`\n(${i}) ${o.name}`),a), []).join('');
    
    // Show the available choices
    console.log("Following devchains are supported:");
    console.log(supportedDevchainNames);

    // Define an array of acceptable choices for the user
    const supportedDevchainOptions = supportedDevChains.reduce((a,o,i) => (a.push(`${i}`),a), []);

    // Ask the user to choose a chain until we get a valid response
    const devchainNumber = requireInput(`What local devchain do you want to use?: `,supportedDevchainOptions);

    // Return the chosen chain
    return supportedDevChains[parseInt(devchainNumber)];    
}


async function getUserServers(k, s) {

    const apiKey = k || getApiKey();
    const apiSecret = s || getApiSecret();
    
    // Retrieve list of servers
    const response = await axios.post(`${BASE_URI}/api/cli/userServers`, {
        apiKey,
        apiSecret,
    });         

    // Return servers
    return response.data.servers;
}

/**
 * Gets a valid path to a file
 * @returns {String}
 */
function getFilePath(question) {

    // Loop until we have a valid file path
    while (true){

        // Ask the user for a valid file path
        file = requireInput(question)

        // Return if the file exists
        if (fs.existsSync(file)) return file;

        // Give the user another try
        console.log("File not found!");
    }
}

/**
 * Gets a selected server region
 * @returns {Object}
 */
function getSelectedServerRegion() {

    // Define list of supported regions
    let possibleRegions = [
        {
            id: 1,
            name: "San Francisco"
        },
        {
            id: 2,
            name: "New York"
        },
        {
            id: 3,
            name: "Toronto"
        },
        {
            id: 4,
            name: "London"
        },
        {
            id: 5,
            name: "Amsterdam"
        },
        {
            id: 6,
            name: "Frankfurt"
        },
        {
            id: 7,
            name: "Bangalore"
        },
        {
            id: 8,
            name: "Singapore"
        }];

    // Check if the user provided a region in the argument list
    let chosenRegion = grab('--region') || grab('-r');         
    
    // If so
    if (chosenRegion){
        // Filter out all regions that does not match the choice
        const possibleSelectedRegions = possibleRegions.filter(item => item.name.toLowerCase() == chosenRegion.toLowerCase());

        // Return region if a match was found
        if (possibleSelectedRegions.length > 0) return possibleSelectedRegions[0];

        // If we get here, the user provided a region is not supported ot was provided in a wrong format
        console.log("Region not found!");
    }
    
    // Define a list of supported regions and display them in the console
    const supportedRegions = possibleRegions.reduce((a,o,i) => ( a.push(`\n(${o.id}) ${o.name}`),a), []).join('');
    console.log(`\nThe following regions are supported:${supportedRegions}\n`)

    // Ask until a valid choice is given
    chosenRegion = requireInput(`In which region would you like your server to be located?: `,possibleRegions.reduce((a,o) => ( a.push(`${o.id}`),a), []));                

    // Return the chosen region
    return possibleRegions[parseInt(chosenRegion) -1];
}


/**
 * Gets a selected server network
 * @returns {Object}
 */
function getSelectedServerNetwork() {

    // Define list of supported networks
    let possibleNetworks = [
        {
            id: 1,
            name: "Mainnet",
            value: "mainnet"
        },
        {
            id: 2,
            name: "Testnet",
            value: "testnet"
        },
        {
            id: 3,
            name: "Local devchain",
            value: "ganache"
        }];    
       
    
    // Check if the user provided a network in the argument list
    let chosenNetwork = grab('--network') || grab('-c');  
    
    // If so
    if (chosenNetwork){

         // Filter out all networks that does not match the choice
        const possibleChosenNetworks = possibleNetworks.filter(item => item.name.toLowerCase() == chosenNetwork.toLowerCase());

        // Return region if a match was found
        if (possibleChosenNetworks.length > 0) return possibleChosenNetworks[0];

        // If we get here, the user provided a region is not supported ot was provided in a wrong format
        console.log("Network not found!");
    }

    // Define a list of supported networks and display them in the console
    const supportedNetworks = possibleNetworks.reduce((a,o,i) => ( a.push(`\n(${o.id}) ${o.name}`),a), []).join(''); 
    console.log(`\nThe following networks are avaiable:${supportedNetworks}\n`)  

    // Ask until a valid choice is given and then return it
    chosenNetwork = requireInput(`On what network would you like the server?: `,possibleNetworks.reduce((a,o) => ( a.push(`${o.id}`),a), []));         
    return possibleNetworks[parseInt(chosenNetwork) - 1];
}

/**
 * Gets a selected server network
 * @returns {Object}
 */
 function getSelectedServerProviders(network) {

    if (network === "ganache") return ["0x539"]
    // Define list of supported chains
    let possibleProviders = getProviders().filter(o => o.network ===  network);    
    
    // Check if the user provided evm chains in the argument list
    let chosenProviders = grab('--evmProviders') || grab('-e');  
    
    // If so
    if (chosenProviders){
        const chosen = chosenProviders.toLowerCase().split(',');

         // Filter out all networks that does not match the choice
         const possibleChosenProviders = possibleProviders.filter(item => chosen.includes(item.chainId));

        // Return chains if a match was found
        if (possibleChosenProviders.length > 0) return possibleChosenProviders.reduce((a,o) => ( a.push(o.chainId),a), []);

        // If we get here, the user provided chains that aret supported or was provided in a wrong format
        console.log("Chain not found!");
    }

    // Define a list of supported networks and display them in the console
    const supportedProviders = possibleProviders.reduce((a,o,i) => ( a.push(`\n(${o.chainId}) ${o.name} - ${o.chain}`),a), []).join(''); 
    console.log(`\nThe following chains are avaiable:${supportedProviders}\n`)  

    // Ask until a valid choice is given and then return it
    chosenProviders = requireInput(`Which evm providers do you want to enable (select at least one, maximum 1 per network)?: `);  
    const selected = chosenProviders.split(','); 
    const result = possibleProviders.filter(o => selected.includes(o.chainId)).reduce((a,o) => ( a.push(o.chainId),a), []); 
    if (result.length > 0) return result;
    console.log("Invalid input!");
    return getSelectedServerProviders(network);
}

/**
 * Gets a selected server network
 * @returns {Object}
 */
 function getSelectedServerProvider(currentProviders) {

    if (currentProviders.length == 1) return currentProviders[0]

    // Define list of supported chains
    let possibleProviders = getProviders().filter(o => currentProviders.includes(o.chainId));    
    
    // Check if the user provided evm chains in the argument list
    let chosenProvider = grab('--evmProvider') || grab('-e');  
    
    // If so
    if (chosenProvider){

         // Filter out all networks that does not match the choice
         const possibleChosenProviders = possibleProviders.filter(item => item.name.toLowerCase() == chosenProviders.toLowerCase());

        // Return chains if a match was found
        if (possibleChosenProviders.length > 0) return possibleChosenProviders[0];

        // If we get here, the user provided chains that aret supported or was provided in a wrong format
        console.log("Chain not found!");
    }

    // Define a list of supported networks and display them in the console
    const supportedProviders = possibleProviders.reduce((a,o,i) => ( a.push(`\n(${o.chainId}) ${o.name} - ${o.chain}`),a), []).join(''); 
    console.log(`\nThe following providers are avaiable:${supportedProviders}\n`)  

    // Ask until a valid choice is given and then return it
    chosenProvider = requireInput(`Which evm provider do you want to use?: `);  
    const result = possibleProviders.filter(o => chosenProvider == o.chainId).reduce((a,o) => ( a.push(o.chainId),a), []); 
    if (result.length > 0) return result[0];
    console.log("Invalid input!");
    return getSelectedServerProvider(currentProviders);
}


function getProviders() {
    return [
      {
        chain: 'Eth',
        name: 'Mainnet',
        network: 'mainnet',
        chainId: '0x1'
      },
      {
        chain: 'Eth',
        name: 'Ropsten',
        network: 'testnet',
        chainId: '0x3'
      },
      {
        chain: 'Eth',
        name: 'Rinkeby',
        network: 'testnet',
        chainId: '0x4',
      },
      {
        chain: 'Eth',
        name: 'Goerli',
        network: 'testnet',
        chainId: '0x5'
      },
      {
        chain: 'Eth',
        name: 'Kovan',
        network: 'testnet',
        chainId: '0x2a'
      },
      {
        chain: 'Eth',
        name: 'LocalDevChain',
        network: 'localdevchain',
        chainId: '0x539'
      },
      {
        chain: 'Polygon',
        name: 'Mainnet',
        network: 'mainnet',
        chainId: '0x89'
      },
      {
        chain: 'Polygon',
        name: 'Mumbai',
        network: 'testnet',
        chainId: '0x13881'
      },
      {
        chain: 'Bsc',
        name: 'Mainnet',
        network: 'mainnet',
        chainId: '0x38'
      },
      {
        chain: 'Bsc',
        name: 'Testnet',
        network: 'testnet',
        chainId: '0x61'
      },
      {
        chain: 'Avalanche',
        name: 'Mainnet',
        network: 'mainnet',
        chainId: '0xa86a'
      },
      {
        chain: 'Avalanche',
        name: 'Testnet',
        network: 'testnet',
        chainId: '0xa869'
      },
      {
        chain: 'Fantom',
        name: 'Mainnet',
        network: 'mainnet',
        chainId: '0xfa'
      },
    ];
  }

/**
 * Compresses the provided directory into a .zip file
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
 function zipDirectory(source, out) {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(out);
  
    return new Promise((resolve, reject) => {
      archive
        .directory(source, false)
        .on('error', err => reject(err))
        .pipe(stream);
  
      stream.on('close', () => resolve());
      archive.finalize();
    });
  }

function getColors (_level) {
    switch(_level) {
        case "error": 
            return "\x1b[31m";
        case "info":
            return "\x1b[33m";
        default:
            return "\x1b[32m";

    }
}

module.exports = {
    zipDirectory,
    getSelectedServerNetwork,
    getSelectedServerRegion,
    getSelectedServerProviders,
    getSelectedServerProvider,
    getFilePath,
    getUserServers,
    getGetLocalDevchain,
    getSelectedServer,
    requireInput,
    getApiKey,
    getApiSecret,
    getColors
}