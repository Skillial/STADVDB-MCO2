
// if ever worrker wont work, use this code
// const nodeID = ['Central', 'Luzon', 'VisMin'];
// let divs = [];
// const time = document.getElementById('Time');
// for (let i = 0; i < 3; i++) {
//     divs.push(document.getElementById(nodeID[i]));
// }
// function updateStatus() {

//     fetch('/status')
//         .then(response => response.json())
//         .then(data => {
//             console.log("here");
//             for (let i = 0; i < 3; i++) {
//                 if (data[i] == 0) {
//                     divs[i].textContent = 'green';
//                 } else {
//                     divs[i].textContent = 'red';
//                 }
//             }
//             time.textContent = "Last Update:" + new Date().toLocaleTimeString();
//         })
//         .catch(error => {
//             console.error('Error updating status:', error);
//         });
// }

// setInterval(updateStatus, 5000);

// updateStatus();


const nodeID = ['Central', 'Luzon', 'VisMin'];
const checkBox = ['CentralCheck', 'LuzonCheck', 'VisMinCheck']
let nodeDivs = [];
let checkDivs = [];
const worker = new Worker('/js/worker.js');
const time = document.getElementById('Time');

for (let i = 0; i < 3; i++) {
    nodeDivs.push(document.getElementById(nodeID[i]));
    checkDivs.push(document.getElementById(checkBox[i]));
}

worker.addEventListener('message', function(e) {
    const data = e.data;
    for (let i = 0; i < 3; i++) {
        if (data[i] === 0) {
            nodeDivs[i].style.backgroundColor = 'green';
            checkDivs[i].checked = true;
        } else {
            nodeDivs[i].style.backgroundColor = 'red';
            checkDivs[i].checked = false;
        }
    }
    time.textContent = "Last Update: " + new Date().toLocaleTimeString();
}, false);

function triggerUpdateStatus() {
    worker.postMessage('updateStatus');
}

setInterval(triggerUpdateStatus, 5000);

triggerUpdateStatus();
