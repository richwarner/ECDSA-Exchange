import "./index.scss";

const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

// Handle transfer
document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const message = document.getElementById("message").value;
  const senderPrivateKey = document.getElementById("sender-private-key").value;
  const senderSignature = document.getElementById("sender-signature").value;

  const body = JSON.stringify({
    sender, amount, recipient, message, senderPrivateKey, senderSignature 
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

// Handle signature generation
document.getElementById("sign-create-signature").addEventListener('click', () => {
  const senderPrivateKey = document.getElementById("sign-sender-private-key").value;
  const message = document.getElementById("message").value;

  const body = JSON.stringify({
    senderPrivateKey, message 
  });

  const request = new Request(`${server}/sign`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ signature }) => {
    document.getElementById("sign-signature-result").value = signature;
    document.getElementById("sender-signature").value = signature;
  });
});


// Handle message construction
document.getElementById("send-amount").addEventListener('keyup', updateMessage);
document.getElementById("recipient").addEventListener('keyup', updateMessage);

function updateMessage() {
  document.getElementById("message").value = `Send ${document.getElementById("send-amount").value} to ${document.getElementById("recipient").value}`; 
  document.getElementById("sign-signature-result").value = "";
  document.getElementById("sender-signature").value = "";
}
