self.addEventListener('message', function(e) {
    if (e.data === 'updateStatus') {
        updateStatus();
    }
}, false);

function updateStatus() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            self.postMessage(data); 
        })
        .catch(error => {
            console.error('Error updating status:', error);
        });
}
