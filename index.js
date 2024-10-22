const config = loadConfig()
const { ethers } = require("ethers");
const {protect} = require("./antiddosprotect");
const express = require("express");
const walletMnemonic = ethers.Wallet.fromPhrase(config.mnemonic);
const provider = new ethers.JsonRpcProvider(config.rpc);
const wallet = walletMnemonic.connect(provider)

const app = express();
app.use(express.json());

app.get("/gasfetch/:address", async function(req, res){
    
    if(!protect(req, res)){
        res.status(400).send({code:"failed", error:"Access denied"})
        return;
    }

    try {
        let current_balance = Number(await ethers.formatEther(await provider.getBalance(wallet.address)))

        if(current_balance < 2){
            res.status(400).send({code:"failed", error:"insufficient funds"})
            console.error("insufficient funds, current balance:", current_balance)
            return;
        }


        let txData = {
            to: req.params.address,
            value: ethers.parseEther(config.send_amount),
        }
        let tx = await wallet.sendTransaction(txData);
    
        await tx.wait(1)
        
        console.log("Send ", config.send_amount, "ETH to",req.params.address)

        res.send({code:"success"})
    } catch (error) {
        console.error(error)
        res.status(400).send({code:"failed", error})
    }

});

app.listen(config.port, async function(){
    console.log("Server run on the port", config.port);
    console.log("Balance",ethers.formatEther(await provider.getBalance(wallet.address)))
    console.log("Run from",wallet.address )
});

function loadConfig(){
    if(process.argv.length < 4)
        throw("Please set --config param")

    if(process?.argv[2] != "--config" && process?.argv[3]?.length == 0)
        throw("Please set --config param")

    const config = require('fs').readFileSync(process.argv[3], 'utf8');

    return JSON.parse(config)
}