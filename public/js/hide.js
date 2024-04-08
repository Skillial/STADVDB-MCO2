let centralCheck = document.getElementById('CentralCheck');
let visminCheck = document.getElementById('VisMinCheck');
let luzonCheck = document.getElementById('LuzonCheck');

let buttonList = [centralCheck, visminCheck, luzonCheck];

let statusList = [];
const statusID = ['Central', 'VisMin', 'Luzon'];

for (let i = 0; i < 3; i++) {
    statusList.push(document.getElementById(statusID[i]));
}

for (let i = 0; i < buttonList.length; i++) {
    buttonList[i].addEventListener('click', async function () {
        try {
            await fetch('/admin/hide/' + i)
                .then(response => response.json())
                .then(response => {
                    if (response.val == 2) {
                        statusList[i].style.backgroundColor = 'yellow';
                    } else {
                        statusList[i].style.backgroundColor = 'white';
                    }
                });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    });
}
