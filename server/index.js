const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const secp = require('@noble/secp256k1');
const SHA256 = require('crypto-js/sha256');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

// Set the total number of accounts
const accountCount = 5;

class keyPair {
  constructor(privateKey, publicKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }
}
const accounts = [];

// Generate initial private-public key pairs and accounts
for(let i = 0; i < accountCount; i++) {
  // Generate one private key and convert it to hex
  const privateKeyHex = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
  // Derive public key from private key and convert it to hex
  const publicKeyHex = secp.utils.bytesToHex(secp.getPublicKey(privateKeyHex));
  // Derive address from public key by [TODO: first hashing it and] using last 40 characters
  const address = "0x" + publicKeyHex.slice(-40);
  // Add key pair to accounts at address
  accounts[address] = new keyPair(privateKeyHex, publicKeyHex);
}

// Set random initial balances for accounts
const balances = {};
for(const address in accounts) {
  balances[address] = Math.round(Math.random() * Math.random() * 100);
}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  // console.log(req.body);
  const {sender, recipient, amount, message, senderPrivateKey, senderSignature} = req.body;
  if(isValidTransaction(sender, recipient, amount, message, senderPrivateKey, senderSignature)) {
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    res.send({ balance: balances[sender] });
    outputAccounts();
  }
  else console.log("Transaction isn't valid.");
});

app.post('/sign', (req, res) => {
  const {senderPrivateKey, message} = req.body; 
  (async () => {
    const messageHash = await secp.utils.sha256(message);
    const signature = await secp.sign(messageHash, senderPrivateKey);
    // console.log("messageHash: " + messageHash);
    // console.log("signature: " + signature);
    res.send({ signature: secp.utils.bytesToHex(signature) });
  })();

});

app.listen(port, () => {
    console.log(`Listening on port ${port}!`); 
    outputAccounts();
  });

// Authenticate the account, and otherwise check that it's a valid transaction
function isValidTransaction(sender, recipient, amount, message, senderPrivateKey, senderSignature) {
  const isValidAmount = amount >= 0;
  const isValidSender = sender in balances;  
  const isValidBalance = amount <= balances[sender];  
  const isValidPrivateKey = senderPrivateKey === accounts[sender].privateKey;  
  const isValidSignature = secp.verify(senderSignature, SHA256(message).toString(), accounts[sender].publicKey); 

  // console.log('isValidSender: ' + isValidSender);
  // console.log('isValidAmount: ' + isValidAmount + ' amount:' + amount + ' balances[sender]: ' + balances[sender]);
  // console.log('isValidPrivateKey: ' + isValidPrivateKey); console.log('senderPrivateKey: ' + senderPrivateKey + ' accounts[sender].privateKey:' + accounts[sender].privateKey);
  // console.log('senderSignature: ' + senderSignature + ' messageHash: ' + SHA256(message).toString() + ' sender: ' + sender); console.log('isValidSignature: ' + isValidSignature);

  return isValidAmount && isValidSender && isValidBalance && (isValidPrivateKey || isValidSignature); 
}

// Console.log the current account information
function outputAccounts() {
  let i = 0;

  // Output available accounts (addresses) and balances
  console.log(`
Available Accounts
==================`);
  for(const address in balances) {
    console.log(`(${i}) ${address} (${balances[address]} ETH)`); 
    i++;
  }

  // Output private keys associated with those accounts
  console.log(`
Private Keys
==================`);
i = 0;
  for(const address in accounts) {
    console.log(`(${i}) ${accounts[address].privateKey}`); 
    i++;
  }
}
