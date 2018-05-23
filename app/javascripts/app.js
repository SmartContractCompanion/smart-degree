// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';
import { default as ethUtil} from 'ethereumjs-util';
import { default as sigUtil} from 'eth-sig-util';
/*
 * When you compile and deploy your Voting contract,
 * truffle stores the abi and deployed address in a json
 * file in the build directory. We will use this information
 * to setup a Voting abstraction. We will use this abstraction
 * later to create an instance of the Voting contract.
 * Compare this against the index.js from our previous tutorial to see the difference
 * https://gist.github.com/maheshmurthy/f6e96d6b3fff4cd4fa7f892de8a1a1b4#file-index-js
 */

var qr = require('qr-image')
import smart_degree_artifacts from '../../build/contracts/SmartDegree.json'

var SmartDegree = contract(smart_degree_artifacts);

window.registerDegree = function(student) {
    var data = {
        registrationNumber: $("#registrationNumber").val(),
        studentFirstname: $("#studentFirstname").val(),
        studentSurname: $("#studentSurname").val(),
        studentBirthDate: $("#studentBirthDate").val(),
        degreeLabel: $("#degreeLabel").val(),
    };
    registerDegree(data)
}

window.verifyDegree = function(student) {
    var data = {
        registrationNumber: $("#registrationNumber").val(),
        studentFirstname: $("#studentFirstname").val(),
        studentSurname: $("#studentSurname").val(),
        studentBirthDate: $("#studentBirthDate").val(),
        degreeLabel: $("#degreeLabel").val(),
    };
    verifyDegree(data)
}

$( document ).ready(function() {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    //$("#verify-result").html("Using web3 detected from external source like Metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);

  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    //$("#verify-result").html("No web3 detected.")
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.1.12:8545"));
  }

  SmartDegree.setProvider(web3.currentProvider);
   if($("#verify-endpoint").is(':visible')){
    var params = getSearchParameters();
        console.log("verify-endpoint")

        var data = {
            registrationNumber: params.registrationNumber,
            studentFirstname: params.studentFirstname,
            studentSurname: params.studentSurname,
            studentBirthDate: params.studentBirthDate,
            degreeLabel: params.degreeLabel,
        };
        verifyAndDisplayDegree(data)
   }
});


function getSearchParameters() {
      var prmstr = window.location.search.substr(1);
      return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
    var params = {};
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}

function registerDegree(data) {
    console.log("registerDegree")
    console.log(data)

    let inputHash = data.registrationNumber.concat(data.studentFirstname).concat(data.studentSurname).concat(data.studentBirthDate).concat(data.degreeLabel)
    console.log("computing keccak256 degree hash with input : ", inputHash);
    let degreeHash = window.web3.sha3(inputHash);
    let degreeId = window.web3.sha3(data.registrationNumber);

    SmartDegree.deployed().then(function(contractInstance) {
        console.log("wallet used : ", web3.eth.accounts[0])
        contractInstance.addDegreeHash(degreeId,degreeHash, {gas: 140000, from: web3.eth.accounts[0]});
    }).then(function() {
        $("#register-result").html("Degree hash added : ".concat(degreeHash));

        var targetUrl = "http://192.168.1.12:8080/verifyEndpoint.html?registrationNumber="+data.registrationNumber+"&studentFirstname="+data.studentFirstname+
        "&studentSurname="+data.studentSurname+"&studentBirthDate="+data.studentBirthDate+"&degreeLabel="+data.degreeLabel

        console.log("target qrCode : " + targetUrl)

        var code = qr.imageSync(targetUrl, { type: 'png' });
        var base64Data = btoa(String.fromCharCode.apply(null, code));
        document.getElementById("verify-qrcode").src = 'data:image/png;base64,'+ base64Data;
    });
}

function verifyDegree(data) {
    console.log("verifyDegree")
    console.log(data)

    let inputHash = data.registrationNumber.concat(data.studentFirstname).concat(data.studentSurname).concat(data.studentBirthDate).concat(data.degreeLabel)
    let degreeHash = window.web3.sha3(inputHash);
    let degreeId = window.web3.sha3(data.registrationNumber);

    SmartDegree.deployed().then(function(contractInstance) {
        return contractInstance.verify(degreeId, degreeHash);
    }).then(function(result) {
      $("#verify-result").html("Verify hash result "+result)
    })
}

function verifyAndDisplayDegree(data) {
    console.log("verifyDegree")
    console.log(data)

    let inputHash = data.registrationNumber.concat(data.studentFirstname).concat(data.studentSurname).concat(data.studentBirthDate).concat(data.degreeLabel)
    let degreeHash = window.web3.sha3(inputHash);
    let degreeId = window.web3.sha3(data.registrationNumber);

    SmartDegree.deployed().then(function(contractInstance) {
        return contractInstance.verify(degreeId, degreeHash);
    }).then(function(result) {

        console.log(result)

        if(result === true){
            result = "EXISTS"
        }else{
            result = "DOESN'T EXIST"
        }

        $("#verify-result").html(result)

        $("#registrationNumber").text(data.registrationNumber)
        $("#studentFirstname").text(data.studentFirstname)
        $("#studentSurname").text(data.studentSurname)
        $("#studentBirthDate").text(data.studentBirthDate)
        $("#degreeLabel").text(data.degreeLabel)
    })
}
