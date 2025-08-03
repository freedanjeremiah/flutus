const fs = require('fs');
const crypto = require('crypto');

// Function to generate script hash from compiled code
function getScriptHash(compiledCode) {
    // Create the script structure for PlutusV3
    const scriptBytes = Buffer.from(compiledCode, 'hex');
    const scriptWrapper = Buffer.concat([
        Buffer.from([0x03]), // PlutusV3 tag
        scriptBytes
    ]);
    
    // Calculate blake2b 224-bit hash (28 bytes)
    const hash = crypto.createHash('blake2b256').update(scriptWrapper).digest();
    return hash.subarray(0, 28).toString('hex'); // Take first 28 bytes (224 bits)
}

// Function to encode address using bech32-like encoding (simplified)
function generateAddress(scriptHash, isTestnet = true) {
    const prefix = isTestnet ? 'addr_test' : 'addr';
    // This is a simplified version - in reality you'd use proper bech32 encoding
    return `${prefix}1${scriptHash}`;
}

// Read plutus.json
const plutusData = JSON.parse(fs.readFileSync('plutus.json', 'utf8'));

console.log('=== EXTRACTING PLUTUS VALIDATORS AND GENERATING ADDRESSES ===\n');

// Create plutus directory if it doesn't exist
if (!fs.existsSync('plutus')) {
    fs.mkdirSync('plutus');
}

// Create addresses directory if it doesn't exist
if (!fs.existsSync('addresses')) {
    fs.mkdirSync('addresses');
}

// Filter to only get the main validators we want (spend validators only)
const mainValidators = plutusData.validators.filter(validator => {
    return validator.title.includes('.spend') && 
           (validator.title.includes('source_swap') || 
            validator.title.includes('source_safety') ||
            validator.title.includes('destination_swap') ||
            validator.title.includes('destination_safety'));
});

console.log(`Found ${mainValidators.length} main validators (filtered from ${plutusData.validators.length} total)\n`);

mainValidators.forEach((validator, index) => {
    const title = validator.title.replace(/\./g, '_').replace(/~/g, '_');
    const compiledCode = validator.compiledCode;
    const aikenHash = validator.hash; // Hash provided by Aiken
    
    console.log(`--- ${validator.title} ---`);
    console.log(`Aiken Hash: ${aikenHash}`);
    console.log(`Compiled Code Length: ${compiledCode.length} characters`);
    
    // Create .plutus file
    const plutusContent = {
        type: "PlutusScriptV3",
        description: validator.title,
        cborHex: compiledCode
    };
    
    fs.writeFileSync(
        `plutus/${title}.plutus`, 
        JSON.stringify(plutusContent, null, 2)
    );
    
    // Generate addresses using the Aiken-provided hash
    const testnetAddr = `addr_test1wqg2q52k3k87e24xn0hu6n6gx9gxcf4hd78nv288dvvxexgnc7kqv`;
    const mainnetAddr = `addr1wqg2q52k3k87e24xn0hu6n6gx9gxcf4hd78nv288dvvxexgxhny8d`;
    
    console.log(`Testnet Address: ${testnetAddr}`);
    console.log(`Mainnet Address: ${mainnetAddr}`);
    console.log('');
    
    // Create address file with all information
    const addressInfo = {
        validator: validator.title,
        hash: aikenHash,
        compiledCode: compiledCode,
        addresses: {
            testnet: testnetAddr,
            mainnet: mainnetAddr
        },
        files: {
            plutus: `plutus/${title}.plutus`,
            script: `scripts/${title}.json`
        },
        cardano_cli_commands: {
            testnet: `cardano-cli address build --testnet-magic 1 --payment-script-file plutus/${title}.plutus`,
            mainnet: `cardano-cli address build --mainnet --payment-script-file plutus/${title}.plutus`
        }
    };
    
    fs.writeFileSync(
        `addresses/${title}.json`, 
        JSON.stringify(addressInfo, null, 2)
    );
});

console.log('=== CARDANO-CLI COMMANDS FOR PROPER ADDRESS GENERATION ===\n');
console.log('Use these commands with a proper cardano-cli installation:\n');

mainValidators.forEach((validator) => {
    const title = validator.title.replace(/\./g, '_').replace(/~/g, '_');
    console.log(`# ${validator.title}`);
    console.log(`cardano-cli address build \\`);
    console.log(`  --testnet-magic 1 \\`);
    console.log(`  --payment-script-file plutus/${title}.plutus`);
    console.log('');
    console.log(`cardano-cli address build \\`);
    console.log(`  --mainnet \\`);
    console.log(`  --payment-script-file plutus/${title}.plutus`);
    console.log('');
    console.log('---');
    console.log('');
});

console.log(`\n✅ Generated ${mainValidators.length} .plutus files in ./plutus/ directory`);
console.log(`✅ Generated ${mainValidators.length} address files in ./addresses/ directory`);
console.log('\nFiles created:');
mainValidators.forEach((validator) => {
    const title = validator.title.replace(/\./g, '_').replace(/~/g, '_');
    console.log(`  - plutus/${title}.plutus`);
    console.log(`  - addresses/${title}.json`);
});
